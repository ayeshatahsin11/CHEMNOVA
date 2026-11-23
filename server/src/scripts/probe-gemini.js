import { AI_PROVIDERS } from '../config/ai.js'
import { callProvider } from '../services/ai/providers.js'

// Usage: node src/scripts/probe-gemini.js [model1 model2 ...]
const defaults = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
  'gemini-2.5-flash-lite',
]
const models = process.argv.length > 2 ? process.argv.slice(2) : defaults

const results = []

for (const model of models) {
  const start = Date.now()
  try {
    await callProvider(
      { ...AI_PROVIDERS.gemini, model },
      {
        messages: [{ role: 'user', content: 'Reply with exactly one word: ready' }],
        json: false,
        temperature: 0.2,
        maxTokens: 800,
        timeoutMs: 20_000,
      },
    )
    const ms = Date.now() - start
    results.push({ model, ms })
    console.log(`OK      ${String(ms).padStart(6)}ms  ${model}`)
  } catch (err) {
    console.log(`FAILED  ${String(Date.now() - start).padStart(6)}ms  ${model}  [${err.kind}] ${err.message.slice(0, 70)}`)
  }
}

results.sort((a, b) => a.ms - b.ms)
console.log(
  results.length
    ? `\nFastest working: ${results[0].model}  ->  put GEMINI_MODEL=${results[0].model} in server/.env`
    : '\nNone worked right now. Google may be overloaded. Try again later and keep Groq as the main provider.',
)