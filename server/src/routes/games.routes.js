import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  gameParamSchema,
  startRoundSchema,
  tzQuerySchema,
  answersSchema,
  revealSchema,
  leaderboardQuerySchema,
  checkSchema,
} from '../validators/games.validators.js'
import {
  getOverview,
  startRound,
  getRound,
  revealClue,
  submitRound,
  getLeaderboard,
  checkAnswer
} from '../controllers/games.controller.js'

const router = Router()

router.use(protect)

router.get('/overview', validate(tzQuerySchema, 'query'), getOverview)
router.get('/leaderboard', validate(leaderboardQuerySchema, 'query'), getLeaderboard)
router.get('/rounds/:id', getRound)
router.post('/rounds/:id/submit', validate(answersSchema), submitRound)
router.post('/rounds/:id/reveal', validate(revealSchema), revealClue)
router.post('/:game/rounds', validate(gameParamSchema, 'params'), validate(startRoundSchema), startRound)
router.post('/rounds/:id/check', validate(checkSchema), checkAnswer)

export default router