
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getDashboard } from '../controllers/analytics.controller.js'

const router = Router()

router.use(protect)
router.get('/dashboard', getDashboard)

export default router