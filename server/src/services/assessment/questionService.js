import crypto from 'node:crypto'
import { z } from 'zod'
import { askAIJSON } from '../ai/aiService.js'
import { QUESTION_TYPES, TYPE_IDS } from '../../config/assessment.js'
import { generationSystem, generationPrompt } from './prompts.js'
import { safeEvaluate } from './numeric.js'

// ---- validation of what the AI returns (each question is checked on its own) ----
const text = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.slice(0, max))
const tag = text(60)

const bool = z.preprocess((v) => {
  if (typeof v !== 'string') return v
  const s = v.trim().toLowerCase()
  return s === 'true' ? true : s === 'false' ? false : v
}, z.boolean())

const schemas = {
  mcq: z
    .object({
      question: text(500),
      options: z.array(text(200)).length(4),
      correctIndex: z.coerce.number().int().min(0).max(3),
      explanation: text(800),
      topicTag: tag,
    })
    .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === 4),

  true_false: z.object({
    question: text(400),
    answer: bool,
    explanation: text(800),
    topicTag: tag,
  }),

  fill_blank: z.object({
    question: text(500).refine((s) => s.includes('___')),
    acceptedAnswers: z.array(text(80)).min(1).max(6),
    explanation: text(800),
    topicTag: tag,
  }),

  numerical: z.object({
    question: text(600),
    expression: text(200),
    answer: z.coerce.number(),
    unit: z.string().trim().max(20).catch(''),
    tolerancePct: z.coerce.number().min(0.5).max(5).catch(1),
    explanation: text(1000),
    topicTag: tag,
  }),

  conceptual: z.object({
    question: text(600),
    modelAnswer: text(1200),
    keyPoints: z.array(text(200)).min(2).max(6),
    topicTag: tag,
  }),

  descriptive: z.object({
    question: text(600),
    modelAnswer: text(1800),
    keyPoints: z.array(text(200)).min(3).max(8),
    topicTag: tag,
  }),
}

const envelope = z.preprocess(
  (v) => (Array.isArray(v) ? { questions: v } : v),
  z.object({ questions: z.array(z.unknown()).min(1) }),
)

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Checks one AI question and turns it into a database-ready question, or returns null if it is not usable
function toQuestion(item) {
  const type = item?.type
  const schema = schemas[type]
  if (!schema) return null

  const parsed = schema.safeParse(item)
  if (!parsed.success) return null
  const p = parsed.data

  const doc = {
    type,
    prompt: p.question,
    marks: QUESTION_TYPES[type].marks,
    topicTag: p.topicTag,
    explanation: p.explanation ?? '',
  }

  switch (type) {
    case 'mcq': {
      const correct = p.options[p.correctIndex]
      const options = shuffle(p.options) // so the right answer is not always in the same place
      return { ...doc, options, correctIndex: options.indexOf(correct) }
    }
    case 'true_false':
      return { ...doc, correctBool: p.answer }
    case 'fill_blank':
      return { ...doc, acceptedAnswers: p.acceptedAnswers }
    case 'numerical': {
      // The answer key is computed by code. If the AI's own number disagrees, the question is dropped.
      const value = safeEvaluate(p.expression)
      if (value === null) return null
      if (Math.abs(value - p.answer) > Math.max(Math.abs(value) * 0.02, 1e-9)) return null
      return {
        ...doc,
        numeric: { expression: p.expression, value, unit: p.unit, tolerancePct: p.tolerancePct },
      }
    }
    default:
      return { ...doc, modelAnswer: p.modelAnswer, keyPoints: p.keyPoints, explanation: p.modelAnswer }
  }
}

// ---- planning and generation ----
export function buildPlan(types, total) {
  const plan = []
  for (let i = 0; i < total; i++) plan.push(types[i % types.length])
  return plan
}

const TOKENS = { mcq: 230, true_false: 150, fill_blank: 170, numerical: 340, conceptual: 340, descriptive: 450 }

const expand = (counts) => TYPE_IDS.flatMap((t) => Array(counts[t] ?? 0).fill(t))

export async function generateQuestions(config) {
  const plan = buildPlan(config.types, config.totalQuestions)

  const missing = Object.fromEntries(TYPE_IDS.map((t) => [t, 0]))
  plan.forEach((t) => missing[t]++)

  const pools = Object.fromEntries(TYPE_IDS.map((t) => [t, []]))
  const seen = new Set()

  // Round 1 asks for everything. Round 2 only asks for what was missing or rejected.
  for (let round = 0; round < 2; round++) {
    const requested = expand(missing)
    if (!requested.length) break

    let out
    try {
      out = await askAIJSON({
        system: generationSystem(config),
        prompt: generationPrompt(config, requested),
        schema: envelope,
        temperature: 0.6,
        maxTokens: Math.min(7000, 1800 + requested.reduce((sum, t) => sum + TOKENS[t], 0)),
        timeoutMs: 45_000,
      })
    } catch (err) {
      if (round === 0) throw err // nothing generated yet
      break
    }

    for (const item of out.data.questions) {
      const q = toQuestion(item)
      if (!q || missing[q.type] <= 0) continue

      const key = q.prompt.toLowerCase().replace(/\s+/g, ' ')
      if (seen.has(key)) continue

      seen.add(key)
      pools[q.type].push(q)
      missing[q.type]--
    }
  }

  // Put the questions back in the planned order
  return plan.map((t) => pools[t].shift()).filter(Boolean)
}