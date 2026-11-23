import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import { createVivaSchema, answerVivaSchema } from '../validators/viva.validators.js'
import {
  getOptions,
  listSessions,
  createSession,
  getSession,
  answerQuestion,
  finishSession,
  deleteSession,
} from '../controllers/viva.controller.js'

const router = Router()

router.use(protect)

router.get('/options', getOptions)
router.get('/sessions', listSessions)
router.post('/sessions', aiLimiter, validate(createVivaSchema), createSession)
router.get('/sessions/:id', getSession)
router.post('/sessions/:id/answer', aiLimiter, validate(answerVivaSchema), answerQuestion)
router.post('/sessions/:id/finish', aiLimiter, finishSession)
router.delete('/sessions/:id', deleteSession)

export default router