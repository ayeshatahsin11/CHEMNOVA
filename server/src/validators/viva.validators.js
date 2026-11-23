import { z } from 'zod'
import { LEVELS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES, MODE_IDS, INPUT_MODES, VIVA_LIMITS } from '../config/viva.js'

// The topic goes into a prompt, so make it a single clean line
const topic = z
  .string()
  .max(VIVA_LIMITS.maxTopicChars, `Topic must be at most ${VIVA_LIMITS.maxTopicChars} characters`)
  .optional()
  .transform((s) => (s ?? '').replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim())

export const createVivaSchema = z.object({
  subject: z.enum(SUBJECTS, 'Choose a subject from the list'),
  topic,
  level: z.enum(LEVELS, 'Choose an academic level'),
  difficulty: z.enum(DIFFICULTIES, 'Choose a difficulty'),
  mode: z.enum(MODE_IDS, 'Choose an exam style'),
  inputMode: z.enum(INPUT_MODES).default('text'),
  totalQuestions: z.coerce
    .number()
    .int('Use a whole number')
    .min(VIVA_LIMITS.minQuestions, `Choose at least ${VIVA_LIMITS.minQuestions} questions`)
    .max(VIVA_LIMITS.maxQuestions, `Choose at most ${VIVA_LIMITS.maxQuestions} questions`),
})

export const answerVivaSchema = z
  .object({
    questionId: z.string().min(1, 'Missing question'),
    answer: z
      .string()
      .max(VIVA_LIMITS.maxAnswerChars, `Keep your answer under ${VIVA_LIMITS.maxAnswerChars} characters`)
      .default('')
      .transform((s) => s.trim()),
    skip: z.boolean().default(false),
  })
  .refine((d) => d.skip || d.answer.length > 0, {
    message: 'Please write an answer or choose Skip',
    path: ['answer'],
  })