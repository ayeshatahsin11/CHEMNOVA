import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { protect } from '../middleware/auth.js'
import { registerSchema, loginSchema } from '../validators/auth.validators.js'
import { register, login, guest, me } from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/guest', authLimiter, guest)
router.get('/me', protect, me)

export default router