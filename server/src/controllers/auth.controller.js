import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signToken } from '../utils/token.js'
import { ROLES } from '../config/roles.js'

const send = (res, status, user) =>
  res.status(status).json({ success: true, token: signToken(user), user })

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, level } = req.validated.body

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  // The role is always set here, never taken from the request
  const user = await User.create({ name, email, password, level, role: ROLES.STUDENT })
  send(res, 201, user)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body

  const user = await User.findOne({ email }).select('+password')
  const valid = user ? await user.comparePassword(password) : false

  // Same message for "no such email" and "wrong password" on purpose
  if (!valid) throw new ApiError(401, 'Incorrect email or password')

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() })
  send(res, 200, user)
})

export const guest = asyncHandler(async (req, res) => {
  const user = await User.create({ name: 'Guest Explorer', isGuest: true })
  send(res, 201, user)
})

export const me = (req, res) => {
  res.json({ success: true, user: req.user })
}