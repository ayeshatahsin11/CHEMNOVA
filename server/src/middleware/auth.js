import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// Requires a valid token and attaches the user to req.user
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new ApiError(401, 'Please log in to continue')

  // Throws if the token is expired or tampered with (the error handler turns it into a 401)
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })

  const user = await User.findById(payload.sub)
  if (!user) throw new ApiError(401, 'This account no longer exists. Please log in again.')

  req.user = user
  next()
})

// Usage: router.get('/admin-only', protect, authorize('admin'), handler)
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Please log in to continue'))
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to do that'))
  }
  next()
}