import { z } from 'zod'
import { GAME_IDS } from '../config/games.js'

export const gameParamSchema = z.object({ game: z.enum(GAME_IDS, 'Unknown game') })

// The body can be missing entirely, so treat that as an empty object
export const startRoundSchema = z.preprocess((v) => v ?? {}, z.object({ tz: z.string().max(64).optional() }))

export const tzQuerySchema = z.object({ tz: z.string().max(64).optional() })

export const answersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choice: z.union([z.number().int().min(0).max(3), z.null()]),
      }),
    )
    .max(60),
})

export const revealSchema = z.object({ questionId: z.string().min(1) })

export const leaderboardQuerySchema = z.object({
  game: z.enum(GAME_IDS, 'Unknown game'),
  period: z.enum(['week', 'all']).default('week'),
})
export const checkSchema = z.object({
  questionId: z.string().min(1),
  choice: z.number().int().min(0).max(3),
})