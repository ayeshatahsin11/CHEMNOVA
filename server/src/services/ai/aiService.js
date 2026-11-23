import crypto from 'node:crypto'
import { AI_PROVIDERS, AI_ORDER } from '../../config/ai.js'
import AICache from '../../models/AICache.js'
import ApiError from '../../utils/ApiError.js'
import { parseModelJSON } from '../../utils/jsonRepair.js'
import { callProvider, AIProviderError } from './providers.js'

const cooldownUntil = new Map() // provider name -> timestamp it may be used again
const disabled = new Map() // provider name -> reason (until the server restarts)

const configured = () =>
  AI_ORDER.map((name) => AI_PROVIDERS[name]).filter((p) => p && p.apiKey && p.model)

export function getProviderStatus() {
  return AI_ORDER.map((name) => {
    const p = AI_PROVIDERS[name]
    if (!p) return { name, state: 'unknown provider name' }
    if (!p.apiKey) return { name, model: p.model, state: 'no key set' }
    if (!p.model) return { name, state: 'no model set' }
    if (disabled.has(name)) return { name, model: p.model, state: `disabled: ${disabled.get(name)}` }
    const wait = (cooldownUntil.get(name) ?? 0) - Date.now()
    if (wait > 0) return { name, model: p.model, state: `cooling down ${Math.ceil(wait / 1000)}s` }
    return { name, model: p.model, state: 'ready' }
  })
}

function penalize(provider, err) {
  if (!(err instanceof AIProviderError)) return
  const now = Date.now()

  switch (err.kind) {
    case 'auth':
      disabled.set(provider.name, 'API key was rejected')
      console.error(`[ai] ${provider.name}: key rejected. Check the key in server/.env, then restart.`)
      break
    case 'model':
      disabled.set(provider.name, `model "${provider.model}" not found`)
      console.error(
        `[ai] ${provider.name}: model "${provider.model}" not found. Run "node src/scripts/list-models.js" and set the model in server/.env.`,
      )
      break
    case 'rate_limit':
      cooldownUntil.set(provider.name, now + (err.retryAfterSec ?? 60) * 1000)
      break
    case 'server':
    case 'timeout':
    case 'network':
      cooldownUntil.set(provider.name, now + 15_000)
      break
    default:
      break
  }
}

const makeCacheKey = (namespace, messages, json) =>
  crypto.createHash('sha256').update(JSON.stringify({ namespace, messages, json })).digest('hex')

/**
 * Ask the AI something. Tries each configured provider in order.
 *
 * generate({
 *   system, prompt, messages,        // messages = earlier conversation turns
 *   json: true, schema,              // schema = optional zod schema, replies that fail it are retried elsewhere
 *   temperature, maxTokens, timeoutMs,
 *   cache: { ttlHours: 24, namespace: 'mcq' },   // optional
 * })
 *
 * Returns { text, data, provider, model, cached }  (data is the parsed JSON when json: true)
 */
export async function generate({
  system,
  prompt,
  messages = [],
  json = false,
  schema,
  temperature = 0.4,
  maxTokens = 1500,
  timeoutMs = 45_000,
  cache,
}) {
  const systemText = json
    ? `${system ? `${system}\n\n` : ''}Respond with a single valid JSON object only. No markdown fences and no commentary outside the JSON.`
    : system

  const full = [
    ...(systemText ? [{ role: 'system', content: systemText }] : []),
    ...messages,
    ...(prompt ? [{ role: 'user', content: prompt }] : []),
  ]
  if (!full.some((m) => m.role === 'user')) {
    throw new Error('generate() needs a prompt or at least one user message')
  }

  // 1. Cache
  const cacheKey = cache ? makeCacheKey(cache.namespace || 'default', full, json) : null
  if (cacheKey) {
    try {
      const hit = await AICache.findOne({ key: cacheKey }).lean()
      if (hit) return { ...hit.result, cached: true }
    } catch (err) {
      console.warn('[ai] cache read failed:', err.message)
    }
  }

  // 2. Pick providers that are configured, not disabled and not cooling down
  const all = configured()
  if (!all.length) throw new ApiError(503, 'AI is not configured on the server')

  const now = Date.now()
  const usable = all.filter((p) => !disabled.has(p.name) && (cooldownUntil.get(p.name) ?? 0) <= now)

  if (!usable.length) {
    const waits = all
      .filter((p) => !disabled.has(p.name))
      .map((p) => Math.ceil(((cooldownUntil.get(p.name) ?? 0) - now) / 1000))
    throw new ApiError(
      503,
      waits.length
        ? `The AI is busy right now. Please try again in about ${Math.max(1, Math.min(...waits))} seconds.`
        : 'The AI service is unavailable right now. Please try again later.',
    )
  }

  // 3. Try them in order
  for (const provider of usable) {
    try {
      const out = await callProvider(provider, {
        messages: full,
        json,
        temperature,
        maxTokens,
        timeoutMs,
      })

      let data
      if (json) {
        data = parseModelJSON(out.text)
        if (schema) {
          const checked = schema.safeParse(data)
          if (!checked.success) {
            throw new AIProviderError(provider.name, 'Reply did not match the expected format', {
              kind: 'invalid_output',
            })
          }
          data = checked.data
        }
      }

      const result = { text: out.text, data, provider: provider.name, model: provider.model }

      if (cacheKey) {
        try {
          await AICache.updateOne(
            { key: cacheKey },
            { $set: { result, expiresAt: new Date(Date.now() + (cache.ttlHours ?? 24) * 3_600_000) } },
            { upsert: true },
          )
        } catch (err) {
          console.warn('[ai] cache write failed:', err.message)
        }
      }

      return { ...result, cached: false }
    } catch (err) {
      penalize(provider, err)
      console.warn(`[ai] ${provider.name} failed: ${err.message}`)
    }
  }

  throw new ApiError(503, 'The AI could not answer right now. Please try again in a moment.')
}

// Shortcuts
export const askAI = (opts) => generate({ ...opts, json: false })
export const askAIJSON = (opts) => generate({ ...opts, json: true })