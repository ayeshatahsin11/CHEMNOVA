import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { GUEST_TTL_HOURS } from '../config/roles.js'

export function signToken(user) {
  // A guest's token lasts exactly as long as the guest account does
  const expiresIn = user.isGuest ? `${GUEST_TTL_HOURS}h` : env.jwtExpiresIn
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn, algorithm: 'HS256' })
}