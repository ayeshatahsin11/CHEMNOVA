import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  })

const isProd = env.nodeEnv === 'production'

// General protection for the whole API
export const apiLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please slow down a little.')

// Stricter, used on login / register / guest routes (relaxed while developing)
export const authLimiter = make(
  15 * 60 * 1000,
  isProd ? 20 : 200,
  'Too many attempts. Please try again in a few minutes.',
)

// Per-user limit for anything that calls the AI. Must run after protect().
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? 'anonymous',
  message: {
    success: false,
    message: 'You are using the AI very quickly. Please wait a few minutes and try again.',
  },
})