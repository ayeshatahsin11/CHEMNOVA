import VivaSession from '../../models/VivaSession.js'
import Assessment from '../../models/Assessment.js'
import AssessmentAttempt from '../../models/AssessmentAttempt.js'
import { dayKey, lastDays, labelFor, currentStreak, longestStreak } from './dateUtils.js'

const round = Math.round
const mean = (list) => list.reduce((total, n) => total + n, 0) / list.length
const shortSubject = (s) => String(s).replace(/ Chemistry$/, '')
const isNumber = (n) => typeof n === 'number' && Number.isFinite(n)

const starters = () => [
  { id: 'first-viva', icon: 'viva', title: 'Take your first viva', reason: 'A short session shows where you stand.', to: '/viva' },
  { id: 'first-test', icon: 'assessment', title: 'Try a timed test', reason: 'Build a short test on what you are studying.', to: '/assessments' },
]

const fillers = () => [
  { id: 'more-viva', icon: 'viva', title: 'Try a harder viva', reason: 'Raise the difficulty to find the gaps in your knowledge.', to: '/viva' },
  { id: 'more-test', icon: 'assessment', title: 'Build a mixed test', reason: 'Mix question types to practise different skills.', to: '/assessments' },
]

// What a brand-new account (or a guest) sees
export function emptyDashboard() {
  return {
    stats: { vivas: 0, assessments: 0, research: 0, streak: 0 },
    mastery: null,
    activity: [],
    subjects: [],
    strong: [],
    weak: [],
    recent: [],
    recommendations: starters(),
    earned: [],
  }
}

export async function buildDashboard(user, tz) {
  if (user.isGuest) return emptyDashboard()

  const today = dayKey(new Date(), tz)

  const [vivas, attempts, vivaCount, attemptCount, activeViva, openAttempt] = await Promise.all([
    VivaSession.find({ user: user._id, status: 'completed' })
      .select('subject score completedAt report.topicScores')
      .sort({ completedAt: -1 })
      .limit(200)
      .lean(),
    AssessmentAttempt.find({ user: user._id, status: 'submitted' })
      .select('assessment score gradingStatus submittedAt report.topicScores')
      .sort({ submittedAt: -1 })
      .limit(200)
      .lean(),
    VivaSession.countDocuments({ user: user._id, status: 'completed' }),
    AssessmentAttempt.countDocuments({ user: user._id, status: 'submitted' }),
    VivaSession.findOne({ user: user._id, status: 'active' }).select('subject').sort({ createdAt: -1 }).lean(),
    AssessmentAttempt.findOne({ user: user._id, status: 'in_progress' }).select('assessment').sort({ createdAt: -1 }).lean(),
  ])

  const assessmentIds = [
    ...new Set([...attempts.map((a) => String(a.assessment)), openAttempt && String(openAttempt.assessment)].filter(Boolean)),
  ]
  const assessments = assessmentIds.length
    ? await Assessment.find({ _id: { $in: assessmentIds } }).select('title subject').lean()
    : []
  const assessmentById = new Map(assessments.map((a) => [String(a._id), a]))

  // Only fully graded work is scored. Attempts still waiting for AI grading are left out.
  const scored = [
    ...vivas
      .filter((v) => isNumber(v.score))
      .map((v) => ({
        kind: 'viva',
        id: String(v._id),
        title: `${v.subject} viva`,
        subject: v.subject,
        score: v.score,
        date: v.completedAt,
        topics: v.report?.topicScores ?? [],
        to: `/viva/${v._id}`,
      })),
    ...attempts
      .filter((a) => a.gradingStatus === 'complete' && isNumber(a.score) && assessmentById.has(String(a.assessment)))
      .map((a) => {
        const assessment = assessmentById.get(String(a.assessment))
        return {
          kind: 'assessment',
          id: String(a._id),
          title: assessment.title,
          subject: assessment.subject,
          score: a.score,
          date: a.submittedAt,
          topics: a.report?.topicScores ?? [],
          to: `/assessments/attempt/${a._id}`,
        }
      }),
  ]

  // Activity: every finished session counts, scored or not
  const dates = [...vivas.map((v) => v.completedAt), ...attempts.map((a) => a.submittedAt)]
    .filter(Boolean)
    .map((d) => dayKey(d, tz))

  const perDay = new Map()
  for (const key of dates) perDay.set(key, (perDay.get(key) ?? 0) + 1)

  const activity = dates.length
    ? lastDays(today, 14).map((key) => ({ label: labelFor(key), sessions: perDay.get(key) ?? 0 }))
    : []

  const streak = currentStreak(dates, today)
  const todayDone = perDay.has(today)

  // Subjects and overall mastery
  const bySubject = new Map()
  for (const s of scored) {
    const name = shortSubject(s.subject)
    bySubject.set(name, [...(bySubject.get(name) ?? []), s.score])
  }
  const subjects = [...bySubject]
    .map(([subject, scores]) => ({ subject, score: round(mean(scores)) }))
    .sort((a, b) => b.score - a.score)
  const mastery = subjects.length ? round(mean(subjects.map((s) => s.score))) : null

  // Topics, averaged across sessions and weighted by how many questions each had
  const byTopic = new Map()
  for (const s of scored) {
    for (const t of s.topics) {
      if (!t?.name || !isNumber(t.score)) continue
      const weight = t.questions > 0 ? t.questions : 1
      const key = t.name.trim().toLowerCase()
      const entry = byTopic.get(key) ?? { name: t.name.trim(), total: 0, weight: 0 }
      entry.total += t.score * weight
      entry.weight += weight
      byTopic.set(key, entry)
    }
  }
  const topics = [...byTopic.values()].map((t) => ({ name: t.name, score: round(t.total / t.weight) }))
  const strong = topics.filter((t) => t.score >= 70).sort((a, b) => b.score - a.score).slice(0, 3)
  const weak = topics.filter((t) => t.score < 60).sort((a, b) => a.score - b.score).slice(0, 3)

  const recent = [...scored]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      type: s.kind,
      title: s.title,
      subject: shortSubject(s.subject),
      score: round(s.score),
      date: s.date,
      to: s.to,
    }))

  // Recommendations: unfinished work first, then weak spots, then the streak
  const [firstViva, firstTest] = starters()
  const recommendations = []

  if (activeViva) {
    recommendations.push({
      id: 'resume-viva',
      icon: 'viva',
      title: `Resume your ${activeViva.subject} viva`,
      reason: 'You left an exam unfinished. Pick up where you stopped.',
      to: `/viva/${activeViva._id}`,
    })
  }
  if (openAttempt) {
    const assessment = assessmentById.get(String(openAttempt.assessment))
    recommendations.push({
      id: 'resume-exam',
      icon: 'assessment',
      title: 'Resume your exam',
      reason: assessment ? `${assessment.title} is still in progress.` : 'You have an unfinished exam.',
      to: `/assessments/attempt/${openAttempt._id}`,
    })
  }
  if (weak[0]) {
    recommendations.push({
      id: 'weak-test',
      icon: 'assessment',
      title: `Revise ${weak[0].name}`,
      reason: `Your lowest topic at ${weak[0].score}%. Try a focused test.`,
      to: '/assessments',
    })
  }
  if (weak[1]) {
    recommendations.push({
      id: 'weak-viva',
      icon: 'viva',
      title: `Viva on ${weak[1].name}`,
      reason: `A conversation can expose the gaps behind ${weak[1].score}%.`,
      to: '/viva',
    })
  }
  if (streak > 0 && !todayDone) {
    recommendations.push({
      id: 'streak',
      icon: 'assessment',
      title: `Protect your ${streak}-day streak`,
      reason: 'A quick test today keeps it going.',
      to: '/assessments',
    })
  }
  if (vivaCount === 0) recommendations.push(firstViva)
  if (attemptCount === 0) recommendations.push(firstTest)

  if (vivaCount + attemptCount > 0) {
    for (const filler of fillers()) {
      if (recommendations.length < 3) recommendations.push(filler)
    }
  }

  // Badges are worked out from your history each time
  const earned = []
  if (vivaCount > 0) earned.push('first-viva')
  if (attemptCount > 0) earned.push('first-test')
  if (longestStreak(dates) >= 3) earned.push('streak-3')
  if (scored.some((s) => s.score >= 90)) earned.push('sharp')

  return {
    stats: { vivas: vivaCount, assessments: attemptCount, research: 0, streak },
    mastery,
    activity,
    subjects,
    strong,
    weak,
    recent,
    recommendations: recommendations.slice(0, 4),
    earned,
  }
}