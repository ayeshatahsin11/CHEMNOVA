import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { aiLimiter } from '../middleware/rateLimit.js'
import {
  createAssessmentSchema,
  saveAnswersSchema,
  submitSchema,
} from '../validators/assessment.validators.js'
import {
  getOptions,
  listAssessments,
  createAssessment,
  getAssessment,
  deleteAssessment,
  startAttempt,
  getAttempt,
  saveAnswers,
  submitAttempt,
  regradeAttempt,
} from '../controllers/assessment.controller.js'

export const assessmentRouter = Router()
assessmentRouter.use(protect)
assessmentRouter.get('/options', getOptions)
assessmentRouter.get('/', listAssessments)
assessmentRouter.post('/', aiLimiter, validate(createAssessmentSchema), createAssessment)
assessmentRouter.get('/:id', getAssessment)
assessmentRouter.delete('/:id', deleteAssessment)
assessmentRouter.post('/:id/attempts', startAttempt)

export const attemptRouter = Router()
attemptRouter.use(protect)
attemptRouter.get('/:id', getAttempt)
attemptRouter.patch('/:id/answers', validate(saveAnswersSchema), saveAnswers)
attemptRouter.post('/:id/submit', aiLimiter, validate(submitSchema), submitAttempt)
attemptRouter.post('/:id/grade', aiLimiter, regradeAttempt)