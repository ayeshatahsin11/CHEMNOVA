import mongoose from 'mongoose'
import { z } from 'zod'
import { connectDB } from '../config/db.js'
import AICache from '../models/AICache.js'
import { askAI, askAIJSON, getProviderStatus } from '../services/ai/aiService.js'

await connectDB()

console.log('\nProviders:')
getProviderStatus().forEach((p) => console.log(`  ${p.name.padEnd(11)} ${p.model || '-'}  [${p.state}]`))

const check = (label, pass, extra = '') => console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`)
const timed = async (fn) => {
  const t = Date.now()
  const result = await fn()
  return { result, ms: Date.now() - t }
}

console.log('')

try {
  // 1. Plain text
  const a = await timed(() => askAI({ prompt: 'Reply with exactly one word: ready', maxTokens: 200 }))
  check('plain text reply', a.result.text.length > 0, `(${a.result.provider}, ${a.ms}ms) -> "${a.result.text.slice(0, 40)}"`)

  // 2. JSON checked against a schema
  const schema = z.object({
    facts: z.array(z.object({ title: z.string(), detail: z.string() })).length(2),
  })
  const request = {
    system: 'You are a concise chemistry teacher.',
    prompt: 'Give exactly 2 short facts about water. Use this shape: {"facts":[{"title":"...","detail":"..."}]}',
    schema,
    maxTokens: 1000,
    cache: { ttlHours: 1, namespace: 'smoke' },
  }

  const b = await timed(() => askAIJSON(request))
  check('JSON reply passes the schema', b.result.data.facts.length === 2, `(${b.result.provider}, ${b.ms}ms)`)
  check('first JSON call was not cached', b.result.cached === false)

  // 3. Same request again should come from the cache
  const c = await timed(() => askAIJSON(request))
  check('second identical call is served from cache', c.result.cached === true, `(${c.ms}ms)`)
  check('cached data matches', JSON.stringify(c.result.data) === JSON.stringify(b.result.data))
} catch (err) {
  console.log('FAIL  ', err.message)
}

console.log('\nProvider state afterwards:')
getProviderStatus().forEach((p) => console.log(`  ${p.name.padEnd(11)} [${p.state}]`))

// clean up the test cache entries
await AICache.deleteMany({ expiresAt: { $lt: new Date(Date.now() + 2 * 3_600_000) } })
await mongoose.disconnect()