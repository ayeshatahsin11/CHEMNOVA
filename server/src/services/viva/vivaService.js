import { z } from 'zod'
import { askAIJSON } from '../ai/aiService.js'
import {
  examinerSystem,
  reportSystem,
  openingPrompt,
  turnPrompt,
  replacementPrompt,
  reportPrompt,
} from './prompts.js'

// Reasoning models need room to think, so token limits are generous
const AI = { temperature: 0.5, timeoutMs: 35_000 }

// Over-long text is trimmed instead of rejected, so one wordy reply does not waste a provider call
const text = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.slice(0, max))

const mark = z.coerce.number().transform((n) => Math.min(10, Math.max(0, n)))

const questionSchema = z.object({ question: text(500), topicTag: text(60) })
const nextSchema = questionSchema.extend({ isFollowUp: z.boolean().optional().catch(false) })

const evaluationSchema = z.object({
  accuracy: mark,
  understanding: mark,
  explanation: mark,
  reasoning: mark,
  feedback: text(700),
  misconception: z
    .string()
    .nullable()
    .optional()
    .transform((v) => {
      const t = (v ?? '').trim()
      return !t || /^(none|null|n\/a|no misconception)\.?$/i.test(t) ? null : t.slice(0, 300)
    }),
})

const turnSchema = z.object({ evaluation: evaluationSchema, next: nextSchema })
const lastTurnSchema = z.object({ evaluation: evaluationSchema })

const reportSchema = z.object({
  summary: text(800),
  improvementAreas: z.array(text(300)).min(1).transform((a) => a.slice(0, 6)),
  revision: z
    .array(z.object({ title: text(120), why: text(300) }))
    .min(1)
    .transform((a) => a.slice(0, 6)),
})

// ---- repeat detection ----
const wordSet = (s) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

function similar(a, b) {
  const A = wordSet(a)
  const B = wordSet(b)
  if (!A.size || !B.size) return false
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / (A.size + B.size - shared) >= 0.8
}

async function ensureFresh(candidate, asked, config) {
  if (!asked.some((q) => similar(candidate.question, q))) return candidate
  try {
    const out = await askAIJSON({
      system: examinerSystem(config),
      prompt: replacementPrompt(config, asked),
      schema: questionSchema,
      maxTokens: 1500,
      ...AI,
    })
    return { ...out.data, isFollowUp: false }
  } catch {
    return candidate // a repeat is better than breaking the exam
  }
}

// ---- public functions ----
export async function generateOpeningQuestion(config) {
  const out = await askAIJSON({
    system: examinerSystem(config),
    prompt: openingPrompt(config),
    schema: questionSchema,
    maxTokens: 1500,
    ...AI,
  })
  return out.data
}

function compactHistory(answered) {
  return answered.slice(-12).map((q) => ({
    n: q.order,
    question: q.question,
    answer: q.skipped ? '(skipped)' : String(q.answer || '').slice(0, 400),
    score: q.overall,
    topic: q.topicTag,
  }))
}

// answered = earlier answered questions, asked = text of every question so far (including current)
export async function evaluateAnswer({ config, answered, asked, current, answer, skipped, isLast }) {
  const out = await askAIJSON({
    system: examinerSystem(config),
    prompt: turnPrompt({
      config,
      asked,
      history: compactHistory(answered),
      question: current.question,
      answer: skipped ? '(skipped)' : answer,
      skipped,
      number: current.order,
      isLast,
    }),
    schema: isLast ? lastTurnSchema : turnSchema,
    maxTokens: 2500,
    ...AI,
  })

  let evaluation = out.data.evaluation
  if (skipped) {
    // Enforced in code, whatever the AI said
    evaluation = { ...evaluation, accuracy: 0, understanding: 0, explanation: 0, reasoning: 0, misconception: null }
  }

  const next = isLast ? null : await ensureFresh(out.data.next, asked, config)
  return { evaluation, next }
}

export async function writeReportNarrative({ config, stats, log }) {
  const out = await askAIJSON({
    system: reportSystem(),
    prompt: reportPrompt({ config, stats, log }),
    schema: reportSchema,
    maxTokens: 3000,
    temperature: 0.4,
    timeoutMs: 40_000,
  })
  return { ...out.data, source: 'ai' }
}