import { ListChecks, ToggleLeft, TextCursorInput, Calculator, Lightbulb, FileText } from 'lucide-react'

// Must match ASSESSMENT_LIMITS.maxAnswerChars in server/src/config/assessment.js
export const MAX_ANSWER_CHARS = 3000

export const typeMeta = {
  mcq: { label: 'Multiple choice', short: 'MCQ', icon: ListChecks },
  true_false: { label: 'True / False', short: 'T/F', icon: ToggleLeft },
  fill_blank: { label: 'Fill in the blank', short: 'Fill in', icon: TextCursorInput },
  numerical: { label: 'Numerical problem', short: 'Numerical', icon: Calculator },
  conceptual: { label: 'Conceptual question', short: 'Conceptual', icon: Lightbulb },
  descriptive: { label: 'Descriptive question', short: 'Descriptive', icon: FileText },
}

export const typeOrder = Object.keys(typeMeta)

export const AI_GRADED_TYPES = ['conceptual', 'descriptive']

// The same round-robin split the server uses to decide how many of each type
export function planCounts(types, total) {
  const ordered = typeOrder.filter((t) => types.includes(t))
  const counts = {}
  if (!ordered.length) return counts
  for (let i = 0; i < total; i++) {
    const t = ordered[i % ordered.length]
    counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

// typeInfo = options.types from the server: [{ id, marks, minutes }]
export function planSummary(typeInfo, types, total) {
  const counts = planCounts(types, total)
  let marks = 0
  let minutes = 0
  for (const info of typeInfo) {
    const n = counts[info.id] ?? 0
    marks += n * info.marks
    minutes += n * info.minutes
  }
  return { counts, marks, minutes }
}

export function suggestMinutes(minutes, limits) {
  const rounded = Math.ceil(minutes / 5) * 5
  return Math.min(limits.maxDuration, Math.max(limits.minDuration, rounded))
}

export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

export const isAnswered = (v) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim())

export const formatMarks = (n) => Math.round((n ?? 0) * 100) / 100

export function formatNumber(n) {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e5 || abs < 1e-3) return n.toExponential(3).replace(/\.?0+e/, 'e')
  return String(Number(n.toPrecision(4)))
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`