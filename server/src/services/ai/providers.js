export class AIProviderError extends Error {
  constructor(provider, message, { kind = 'unknown', status, retryAfterSec } = {}) {
    super(message)
    this.name = 'AIProviderError'
    this.provider = provider
    this.kind = kind // rate_limit | auth | model | server | timeout | network | bad_request | empty | invalid_output
    this.status = status
    this.retryAfterSec = retryAfterSec
  }
}

function kindFromStatus(status) {
  if (status === 429) return 'rate_limit'
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'model'
  if (status >= 500) return 'server'
  return 'bad_request'
}

async function readErrorMessage(res) {
  try {
    const body = await res.json()
    const first = Array.isArray(body) ? body[0] : body
    return String(first?.error?.message || first?.message || '').slice(0, 200)
  } catch {
    return ''
  }
}

export async function callProvider(provider, { messages, json, temperature, maxTokens, timeoutMs }) {
  let res
  try {
    res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json && { response_format: { type: 'json_object' } }),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    const timedOut = err.name === 'TimeoutError' || err.name === 'AbortError'
    throw new AIProviderError(provider.name, timedOut ? 'Request timed out' : 'Network error', {
      kind: timedOut ? 'timeout' : 'network',
    })
  }

  if (!res.ok) {
    const detail = await readErrorMessage(res)
    const retryAfter = Number(res.headers.get('retry-after'))
    throw new AIProviderError(provider.name, `HTTP ${res.status}${detail ? `: ${detail}` : ''}`, {
      kind: kindFromStatus(res.status),
      status: res.status,
      retryAfterSec: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    })
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new AIProviderError(provider.name, 'Provider sent an unreadable response', { kind: 'server' })
  }

  const text = data?.choices?.[0]?.message?.content
  if (!text || !String(text).trim()) {
    throw new AIProviderError(provider.name, 'Provider returned an empty reply', { kind: 'empty' })
  }

  return { text: String(text).trim(), usage: data.usage }
}