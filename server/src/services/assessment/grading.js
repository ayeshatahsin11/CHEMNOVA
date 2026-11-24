import { z } from 'zod'
import { askAIJSON } from '../ai/aiService.js'
import { AI_GRADED } from '../../config/assessment.js'
import { parseNumber, numericMatches, formatNumber } from './numeric.js'
import { gradingSystem, gradingPrompt } from './prompts.js'

const isEmpty = (r) => r === undefined || r === null || (typeof r === 'string' && !r.trim())

// Ignores case, spaces and punctuation, and turns subscripts into digits (H₂O = h2o)
const normalizeText = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\u2212/g, '-')
    .replace(/[^\p{L}\p{N}+-]/gu, '')

const result = (q, patch) => ({
  questionId: q._id,
  gradedBy: 'auto',
  pending: false,
  answered: true,
  correct: false,
  earned: 0,
  max: q.marks,
  feedback: '',
  covered: [],
  ...patch,
})

// Code-only grading for mcq, true_false, fill_blank and numerical
export function gradeObjective(q, response) {
  if (isEmpty(response)) return result(q, { answered: false, feedback: 'Not answered.' })

  switch (q.type) {
    case 'mcq': {
      const ok = response === q.correctIndex
      return result(q, { correct: ok, earned: ok ? q.marks : 0, feedback: ok ? 'Correct.' : 'Incorrect.' })
    }
    case 'true_false': {
      const ok = response === q.correctBool
      return result(q, { correct: ok, earned: ok ? q.marks : 0, feedback: ok ? 'Correct.' : 'Incorrect.' })
    }
    case 'fill_blank': {
      const given = normalizeText(response)
      const ok = given.length > 0 && (q.acceptedAnswers ?? []).some((a) => normalizeText(a) === given)
      return result(q, { correct: ok, earned: ok ? q.marks : 0, feedback: ok ? 'Correct.' : 'Incorrect.' })
    }
    case 'numerical': {
      const n = parseNumber(response)
      if (n === null) return result(q, { feedback: 'We could not read a number from your answer.' })

      const ok = numericMatches(n, q.numeric.value, q.numeric.tolerancePct ?? 1)
      const unit = q.numeric.unit ? ` ${q.numeric.unit}` : ''
      return result(q, {
        correct: ok,
        earned: ok ? q.marks : 0,
        feedback: ok ? 'Correct.' : `Incorrect. The expected value is about ${formatNumber(q.numeric.value)}${unit}.`,
      })
    }
    default:
      return result(q, { feedback: 'This question type is not graded automatically.' })
  }
}

// ---- AI grading for conceptual and descriptive answers (one call for all of them) ----
const gradesSchema = z.object({
  grades: z.array(
    z.object({
      n: z.coerce.number().int(),
      score: z.coerce.number().transform((n) => Math.min(10, Math.max(0, n))),
      feedback: z.string().trim().min(1).transform((s) => s.slice(0, 600)),
      covered: z.array(z.coerce.number().int()).catch([]),
    }),
  ),
})

async function gradeWithAI(entries) {
  const out = await askAIJSON({
    system: gradingSystem(),
    prompt: gradingPrompt(entries),
    schema: gradesSchema,
    temperature: 0.2,
    maxTokens: Math.min(6000, 1500 + entries.length * 350),
    timeoutMs: 45_000,
  })
  const byN = new Map(out.data.grades.map((g) => [g.n, g]))
  return entries.map((_, i) => byN.get(i + 1) ?? null)
}

const pendingResult = (q) =>
  result(q, { gradedBy: 'ai', pending: true, feedback: 'Waiting for AI grading. Try again in a moment.' })

/**
 * Grades every question. Results that are already final (not pending) are kept as they are,
 * so calling this again only retries the answers still waiting for the AI.
 */
export async function gradeAll({ questions, answerMap, previous }) {
  const prev = new Map((previous ?? []).map((r) => [String(r.questionId), r]))
  const results = new Array(questions.length)
  const batch = []

  questions.forEach((q, i) => {
    const old = prev.get(String(q._id))
    if (old && !old.pending) {
      results[i] = old
      return
    }

    const response = answerMap.get(String(q._id))

    if (!AI_GRADED.has(q.type)) {
      results[i] = gradeObjective(q, response)
    } else if (isEmpty(response)) {
      results[i] = result(q, { answered: false, feedback: 'Not answered.' })
    } else {
      results[i] = pendingResult(q)
      batch.push({ index: i, q, response: String(response).trim() })
    }
  })

  if (batch.length) {
    try {
      const grades = await gradeWithAI(batch.map(({ q, response }) => ({ q, response })))
      batch.forEach((item, k) => {
        const g = grades[k]
        if (!g) return // stays pending

        const earned = Math.round((g.score / 10) * item.q.marks * 100) / 100
        results[item.index] = result(item.q, {
          gradedBy: 'ai',
          earned,
          correct: earned >= item.q.marks - 1e-9,
          feedback: g.feedback,
          covered: g.covered.filter((n) => n >= 0 && n < item.q.keyPoints.length),
        })
      })
    } catch (err) {
      console.warn('[assessment] AI grading failed, those answers stay pending:', err.message)
    }
  }

  return {
    results,
    gradingStatus: results.some((r) => r.pending) ? 'pending' : 'complete',
  }
}