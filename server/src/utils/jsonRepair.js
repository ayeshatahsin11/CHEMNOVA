// Models sometimes wrap JSON in ```json fences or add a sentence around it.
// This tries progressively more forgiving ways to extract the JSON.
export function parseModelJSON(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty reply')

  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // keep going
  }

  // Take everything from the first { or [ to the last } or ]
  const starts = [cleaned.indexOf('{'), cleaned.indexOf('[')].filter((i) => i !== -1)
  if (starts.length) {
    const start = Math.min(...starts)
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (end > start) {
      const slice = cleaned.slice(start, end + 1)
      try {
        return JSON.parse(slice)
      } catch {
        // last attempt: remove trailing commas before } or ]
        return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1'))
      }
    }
  }

  throw new Error('Reply was not valid JSON')
}