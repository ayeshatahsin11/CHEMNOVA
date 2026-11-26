import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
} from '../validators/companion.validators.js'
import {
  getOptions,
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
} from '../controllers/companion.controller.js'

const router = Router()

router.use(protect)

router.get('/options', getOptions)
router.get('/conversations', listConversations)
router.post('/conversations', validate(createConversationSchema), createConversation)
router.get('/conversations/:id', getConversation)
router.patch('/conversations/:id', validate(updateConversationSchema), updateConversation)
router.delete('/conversations/:id', deleteConversation)
router.post('/conversations/:id/messages', aiLimiter, validate(sendMessageSchema), sendMessage)

export default router