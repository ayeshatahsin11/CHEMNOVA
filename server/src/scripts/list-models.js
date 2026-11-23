import { AI_PROVIDERS } from '../config/ai.js'

// Usage: node src/scripts/list-models.js [filter]
// Example: node src/scripts/list-models.js flash
const filter = (process.argv[2] || '').toLowerCase()

for (const provider of Object.values(AI_PROVIDERS)) {
  console.log(`\n=== ${provider.name} (currently using: ${provider.model || 'not set'}) ===`)

  if (!provider.apiKey) {
    console.log('No key set, skipping.')
    continue
  }

  try {
    const res = await fetch(`${provider.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.log(`HTTP ${res.status}: could not list models`)
      continue
    }
    const body = await res.json()
    const ids = (body.data || [])
      .map((m) => String(m.id).replace(/^models\//, ''))
      .filter((id) => !filter || id.toLowerCase().includes(filter))
      .sort()
    if (!ids.length) console.log('No matching models.')
    ids.forEach((id) => console.log(' ', id))
  } catch (err) {
    console.log('Request failed:', err.message)
  }
}