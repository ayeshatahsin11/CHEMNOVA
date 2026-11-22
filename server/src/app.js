import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'

const app = express()

// Render runs behind a proxy, and rate limiting needs the real client IP
if (env.nodeEnv === 'production') app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))
if (env.nodeEnv !== 'production') app.use(morgan('dev'))

app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ChemNova API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)

// More feature routes get mounted here in the next steps

app.use(notFound)
app.use(errorHandler)

export default app