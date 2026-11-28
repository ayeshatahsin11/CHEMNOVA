import { env } from '../config/env.js'

// Waits until the API server answers, so a test never starts while the server is still restarting
export async function waitForServer({ timeoutMs = 30_000 } = {}) {
  const url = `http://127.0.0.1:${env.port}/api/health`
  const started = Date.now()
  let announced = false

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      const body = await res.json()
      if (res.ok && body.status === 'ok' && body.database === 'connected') return
    } catch {
      // not ready yet
    }

    if (!announced) {
      console.log('Waiting for the API server to be ready (it may still be restarting)...')
      announced = true
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.error(
    `\nThe API server did not answer at ${url} within ${timeoutMs / 1000} seconds.\n` +
      'Make sure "npm run dev" is running in another terminal, and look there for errors.',
  )
  process.exit(1)
}