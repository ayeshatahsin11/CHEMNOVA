import { z } from 'zod'
import { LEVELS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES } from '../config/viva.js'
import { TYPE_IDS, ASSESSMENT_LIMITS as L } from '../config/assessment.js'

// The topic goes into a prompt, so make it a single clean line
const topic = z
  .string()
  .max(L.maxTopicChars, `Topic must be at most ${L.maxTopicChars} characters`)
  .optional()
  .transform((s) => (s ?? '').replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim())

export const createAssessmentSchema = z.object({
  subject: z.enum(SUBJECTS, 'Choose a subject from the list'),
  topic,
  level: z.enum(LEVELS, 'Choose an academic level'),
  difficulty: z.enum(DIFFICULTIES, 'Choose a difficulty'),
  types: z
    .array(z.enum(TYPE_IDS))
    .min(1, 'Choose at least one question type')
    .transform((arr) => TYPE_IDS.filter((t) => arr.includes(t))), // unique, in a fixed order
  totalQuestions: z.coerce
    .number()
    .int('Use a whole number')
    .min(L.minQuestions, `Choose at least ${L.minQuestions} questions`)
    .max(L.maxQuestions, `Choose at most ${L.maxQuestions} questions`),
  durationMinutes: z.coerce
    .number()
    .int()
    .refine((n) => n === 0 || (n >= L.minDuration && n <= L.maxDuration), {
      message: `Choose untimed (0) or ${L.minDuration} to ${L.maxDuration} minutes`,
    })
    .default(0),
})

const response = z.union([
  z.string().max(L.maxAnswerChars, `Keep your answer under ${L.maxAnswerChars} characters`),
  z.number(),
  z.boolean(),
  z.null(),
])

const answerItem = z.object({ questionId: z.string().min(1), response })

export const saveAnswersSchema = z.object({ answers: z.array(answerItem).max(50) })
export const submitSchema = z.object({ answers: z.array(answerItem).max(50).optional() })