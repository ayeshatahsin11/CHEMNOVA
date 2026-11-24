import { QUESTION_TYPES } from '../../config/assessment.js'
import { gradeLabel } from '../viva/scoring.js'

const round1 = (n) => Math.round(n * 10) / 10
const round2 = (n) => Math.round(n * 100) / 100
const sum = (list, key) => list.reduce((total, x) => total + x[key], 0)
const pct = (a, b) => (b > 0 ? round1((a / b) * 100) : 0)

// Everything here is calculated by code. Answers still waiting for AI grading are left out of the score.
export function buildReport({ assessment, attempt, results }) {
  const byQuestion = new Map(results.map((r) => [String(r.questionId), r]))
  const graded = results.filter((r) => !r.pending)

  const earnedMarks = round2(sum(graded, 'earned'))
  const totalMarks = sum(graded, 'max')
  const score = pct(earnedMarks, totalMarks)

  const byType = []
  for (const [id, info] of Object.entries(QUESTION_TYPES)) {
    const questions = assessment.questions.filter((q) => q.type === id)
    if (!questions.length) continue

    const rs = questions.map((q) => byQuestion.get(String(q._id))).filter((r) => r && !r.pending)
    byType.push({
      type: id,
      label: info.label,
      questions: questions.length,
      correct: rs.filter((r) => r.correct).length,
      earned: round2(sum(rs, 'earned')),
      max: sum(rs, 'max'),
      pct: pct(sum(rs, 'earned'), sum(rs, 'max')),
    })
  }

  const topics = new Map()
  for (const q of assessment.questions) {
    const r = byQuestion.get(String(q._id))
    if (!r || r.pending) continue

    const name = (q.topicTag || 'General').trim() || 'General'
    const t = topics.get(name.toLowerCase()) ?? { name, earned: 0, max: 0, questions: 0 }
    t.earned += r.earned
    t.max += r.max
    t.questions += 1
    topics.set(name.toLowerCase(), t)
  }

  const topicScores = [...topics.values()].map((t) => ({
    name: t.name,
    score: pct(t.earned, t.max),
    questions: t.questions,
  }))

  const strongTopics = topicScores
    .filter((t) => t.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  const weakTopics = topicScores
    .filter((t) => t.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const lowest = [...topicScores].sort((a, b) => a.score - b.score)[0]
  const revision = weakTopics.length
    ? weakTopics.map((t) => ({ title: t.name, why: `You scored ${t.score}% on this topic in this assessment.` }))
    : lowest
      ? [{ title: lowest.name, why: `This was your lowest-scoring topic (${lowest.score}%).` }]
      : []

  return {
    score,
    grade: gradeLabel(score),
    earnedMarks,
    totalMarks,
    pendingCount: results.length - graded.length,
    questions: results.length,
    answered: results.filter((r) => r.answered).length,
    unanswered: results.filter((r) => !r.answered).length,
    correct: graded.filter((r) => r.correct).length,
    partial: graded.filter((r) => r.answered && !r.correct && r.earned > 0).length,
    incorrect: graded.filter((r) => r.answered && r.earned === 0).length,
    byType,
    topicScores,
    strongTopics,
    weakTopics,
    revision,
    timeTakenSec: attempt.timeTakenSec ?? 0,
    durationMinutes: assessment.durationMinutes,
    timedOut: Boolean(attempt.timedOut),
  }
}