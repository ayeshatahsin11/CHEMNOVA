import rateLimit from 'express-rate-limit'

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  })

// General protection for the whole API
export const apiLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please slow down a little.')

// Stricter, used on login / register / guest routes
export const authLimiter = make(15 * 60 * 1000, 20, 'Too many attempts. Please try again in a few minutes.')