import { AI_PROVIDERS } from '../config/ai.js'
import { callProvider } from '../services/ai/providers.js'

// Usage: node src/scripts/test-provider.js gemini [model-name]
const base = AI_PROVIDERS[process.argv[2]]

if (!base) {
  console.log('Usage: node src/scripts/test-provider.js gemini|groq|openrouter [model-name]')
  process.exit(1)
}

const provider = { ...base, model: process.argv[3] || base.model }

console.log(`Testing ${provider.name} with model ${provider.model} (waits up to 90s)...`)
const start = Date.now()

try {
  const out = await callProvider(provider, {
    messages: [{ role: 'user', content: 'Reply with exactly one word: ready' }],
    json: false,
    temperature: 0.2,
    maxTokens: 800,
    timeoutMs: 90_000,
  })
  console.log(`OK in ${Date.now() - start}ms ->`, out.text)
} catch (err) {
  console.log(`FAILED after ${Date.now() - start}ms [${err.kind}]:`, err.message)
}