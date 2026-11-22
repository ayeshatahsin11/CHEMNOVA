import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import { env } from './config/env.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))
if (env.nodeEnv !== 'production') app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ChemNova API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  })
})

export default app