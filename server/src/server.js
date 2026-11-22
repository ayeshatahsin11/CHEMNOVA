import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'

async function start() {
  try {
    await connectDB()
    app.listen(env.port, () => {
      console.log(`ChemNova API running on http://localhost:${env.port}`)
    })
  } catch (err) {
    console.error('Failed to start the server:', err.message)
    process.exit(1)
  }
}

start()