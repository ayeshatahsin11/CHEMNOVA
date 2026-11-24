import Assessment from '../models/Assessment.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { LEVELS, GUEST_LIMITS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES } from '../config/viva.js'
import { QUESTION_TYPES, TYPE_IDS, AI_GRADED, ASSESSMENT_LIMITS as L } from '../config/assessment.js'
import { generateQuestions } from '../services/assessment/questionService.js'
import { gradeAll } from '../services/assessment/grading.js'
import { buildReport } from '../services/assessment/report.js'

const expiryFor = (user) => (user.isGuest && user.expiresAt ? { expiresAt: user.expiresAt } : {})
const graceMs = L.gracePeriodSec * 1000
const isExpired = (attempt) => Boolean(attempt.deadline && Date.now() > attempt.deadline.getTime() + graceMs)

// ---- what the browser is allowed to see ----
// During the exam: no answers, explanations or model answers
function clientQuestion(q) {
  const out = { id: q.id, type: q.type, prompt: q.prompt, marks: q.marks, topicTag: q.topicTag }
  if (q.type === 'mcq') out.options = q.options
  if (q.type === 'numerical') out.unit = q.numeric?.unit ?? ''
  return out
}

// After submitting: everything, so the student can learn from it
function reviewQuestion(q) {
  const out = { ...clientQuestion(q), explanation: q.explanation }
  if (q.type === 'mcq') out.correctIndex = q.correctIndex
  if (q.type === 'true_false') out.correctBool = q.correctBool
  if (q.type === 'fill_blank') out.acceptedAnswers = q.acceptedAnswers
  if (q.type === 'numerical') {
    out.correctValue = q.numeric.value
    out.tolerancePct = q.numeric.tolerancePct
  }
  if (AI_GRADED.has(q.type)) {
    out.modelAnswer = q.modelAnswer
    out.keyPoints = q.keyPoints
  }
  return out
}

const answersObject = (attempt) =>
  Object.fromEntries(attempt.answers.map((a) => [String(a.questionId), a.response]))

function attemptInfo(attempt, assessment) {
  return {
    id: attempt.id,
    assessmentId: assessment.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadline: attempt.deadline ?? null,
    durationMinutes: assessment.durationMinutes,
    serverNow: new Date().toISOString(), // lets the browser correct for a wrong clock
    expired: attempt.status === 'in_progress' && isExpired(attempt),
    ...(attempt.status === 'submitted' && {
      submittedAt: attempt.submittedAt,
      timeTakenSec: attempt.timeTakenSec,
      timedOut: attempt.timedOut,
      gradingStatus: attempt.gradingStatus,
      score: attempt.score,
    }),
  }
}

const progressView = (attempt, assessment) => ({
  attempt: attemptInfo(attempt, assessment),
  assessment,
  questions: assessment.questions.map(clientQuestion),
  answers: answersObject(attempt),
})

function reviewView(attempt, assessment) {
  const answers = answersObject(attempt)
  const byQuestion = new Map(attempt.results.map((r) => [String(r.questionId), r]))

  return {
    attempt: attemptInfo(attempt, assessment),
    assessment,
    questions: assessment.questions.map((q) => {
      const r = byQuestion.get(q.id)
      return {
        ...reviewQuestion(q),
        response: answers[q.id] ?? null,
        result: r && {
          earned: r.earned,
          max: r.max,
          correct: r.correct,
          answered: r.answered,
          pending: r.pending,
          gradedBy: r.gradedBy,
          feedback: r.feedback,
          covered: r.covered,
        },
      }
    }),
    report: attempt.report,
  }
}

// ---- answer handling ----
function cleanResponse(q, r) {
  if (r === null || r === undefined) return null
  switch (q.type) {
    case 'mcq':
      return Number.isInteger(r) && r >= 0 && r < 4 ? r : null
    case 'true_false':
      if (typeof r === 'boolean') return r
      return r === 'true' ? true : r === 'false' ? false : null
    case 'numerical':
      if (typeof r === 'number') return String(r)
      return typeof r === 'string' ? r.trim().slice(0, 40) || null : null
    default:
      return typeof r === 'string' ? r.trim() || null : null
  }
}

function cleanAnswers(assessment, list = []) {
  const byId = new Map(assessment.questions.map((q) => [q.id, q]))
  const out = []
  for (const item of list) {
    const q = byId.get(item.questionId)
    if (q) out.push({ questionId: q.id, response: cleanResponse(q, item.response) })
  }
  return out
}

// A null response clears an answer
function mergeAnswers(existing, incoming) {
  const map = new Map(existing.map((a) => [String(a.questionId), a.response]))
  for (const a of incoming) {
    if (a.response === null) map.delete(a.questionId)
    else map.set(a.questionId, a.response)
  }
  return [...map].map(([questionId, response]) => ({ questionId, response }))
}

async function findOwnedAssessment(req) {
  const found = await Assessment.findOne({ _id: req.params.id, user: req.user._id })
  if (!found) throw new ApiError(404, 'Assessment not found')
  return found
}

async function findOwnedAttempt(req) {
  const found = await AssessmentAttempt.findOne({ _id: req.params.id, user: req.user._id })
  if (!found) throw new ApiError(404, 'Attempt not found')
  return found
}

async function loadAssessment(attempt) {
  const assessment = await Assessment.findById(attempt.assessment)
  if (!assessment) throw new ApiError(404, 'Assessment not found')
  return assessment
}

// Grades what can be graded, builds the report and saves it. Safe to run again to retry pending answers.
async function finalizeGrading(attempt, assessment) {
  const { results, gradingStatus } = await gradeAll({
    questions: assessment.questions,
    answerMap: new Map(attempt.answers.map((a) => [String(a.questionId), a.response])),
    previous: attempt.results.length ? attempt.results.map((r) => r.toObject()) : undefined,
  })

  const report = buildReport({ assessment, attempt, results })

  attempt.results = results
  attempt.gradingStatus = gradingStatus
  attempt.report = report
  attempt.score = report.score
  attempt.earnedMarks = report.earnedMarks
  attempt.totalMarks = report.totalMarks
  await attempt.save()
}

// ---- endpoints ----

// GET /api/assessments/options
export const getOptions = (req, res) => {
  const guest = req.user.isGuest
  const maxQuestions = guest ? GUEST_LIMITS.assessmentMaxQuestions : L.maxQuestions

  res.json({
    success: true,
    options: {
      subjects: SUBJECTS,
      levels: LEVELS,
      difficulties: DIFFICULTIES,
      types: TYPE_IDS.map((id) => ({
        id,
        label: QUESTION_TYPES[id].label,
        marks: QUESTION_TYPES[id].marks,
        minutes: QUESTION_TYPES[id].minutes,
        aiGraded: AI_GRADED.has(id),
      })),
      limits: {
        minQuestions: L.minQuestions,
        maxQuestions,
        defaultQuestions: Math.min(L.defaultQuestions, maxQuestions),
        minDuration: L.minDuration,
        maxDuration: L.maxDuration,
        maxAnswerChars: L.maxAnswerChars,
        maxTopicChars: L.maxTopicChars,
      },
      guest: guest ? { assessments: GUEST_LIMITS.assessments } : null,
    },
  })
}

// GET /api/assessments (guests are not saved, so they get an empty list)
export const listAssessments = asyncHandler(async (req, res) => {
  if (req.user.isGuest) return res.json({ success: true, assessments: [] })

  const assessments = await Assessment.find({ user: req.user._id })
    .select('-questions')
    .sort({ createdAt: -1 })
    .limit(30)

  const attempts = await AssessmentAttempt.find({
    user: req.user._id,
    assessment: { $in: assessments.map((a) => a._id) },
  })
    .select('assessment status score createdAt')
    .sort({ createdAt: -1 })

  const stats = new Map()
  for (const at of attempts) {
    const key = String(at.assessment)
    const s = stats.get(key) ?? { attempts: 0, bestScore: null, lastScore: null, inProgressAttemptId: null }

    if (at.status === 'in_progress') {
      s.inProgressAttemptId = at.id
    } else {
      s.attempts += 1
      if (s.attempts === 1) s.lastScore = at.score ?? null // attempts are newest first
      if (at.score != null && (s.bestScore === null || at.score > s.bestScore)) s.bestScore = at.score
    }
    stats.set(key, s)
  }

  const empty = { attempts: 0, bestScore: null, lastScore: null, inProgressAttemptId: null }
  res.json({
    success: true,
    assessments: assessments.map((a) => ({ ...a.toJSON(), ...(stats.get(String(a._id)) ?? empty) })),
  })
})

// POST /api/assessments: generate a new assessment
export const createAssessment = asyncHandler(async (req, res) => {
  const config = req.validated.body

  if (req.user.isGuest) {
    if (config.totalQuestions > GUEST_LIMITS.assessmentMaxQuestions) {
      throw new ApiError(
        403,
        `Guests can build tests of up to ${GUEST_LIMITS.assessmentMaxQuestions} questions. Create a free account for longer tests.`,
      )
    }
    const used = await Assessment.countDocuments({ user: req.user._id })
    if (used >= GUEST_LIMITS.assessments) {
      throw new ApiError(403, `Guests can build ${GUEST_LIMITS.assessments} tests. Create a free account to continue.`)
    }
  }

  const questions = await generateQuestions(config)

  // Some AI questions get rejected, so accept a test as long as at least half came out
  if (questions.length < Math.max(1, Math.ceil(config.totalQuestions / 2))) {
    throw new ApiError(503, 'The AI could not produce enough valid questions this time. Please try again.')
  }

  const assessment = await Assessment.create({
    user: req.user._id,
    title: config.topic ? `${config.subject}: ${config.topic}` : config.subject,
    subject: config.subject,
    topic: config.topic,
    level: config.level,
    difficulty: config.difficulty,
    types: config.types,
    requestedQuestions: config.totalQuestions,
    questionCount: questions.length,
    totalMarks: questions.reduce((total, q) => total + q.marks, 0),
    durationMinutes: config.durationMinutes,
    questions,
    ...expiryFor(req.user),
  })

  res.status(201).json({
    success: true,
    assessment,
    generated: questions.length,
    requested: config.totalQuestions,
  })
})

// GET /api/assessments/:id: details and past attempts (no questions)
export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await findOwnedAssessment(req)

  const attempts = await AssessmentAttempt.find({ assessment: assessment._id, user: req.user._id })
    .select('status score gradingStatus submittedAt timeTakenSec timedOut createdAt')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    assessment,
    attempts: attempts.filter((a) => a.status === 'submitted'),
    inProgressAttemptId: attempts.find((a) => a.status === 'in_progress')?.id ?? null,
  })
})

// DELETE /api/assessments/:id
export const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await findOwnedAssessment(req)
  await AssessmentAttempt.deleteMany({ assessment: assessment._id })
  await assessment.deleteOne()
  res.json({ success: true })
})

// POST /api/assessments/:id/attempts: start an attempt, or resume the unfinished one
export const startAttempt = asyncHandler(async (req, res) => {
  const assessment = await findOwnedAssessment(req)
  const unfinished = { assessment: assessment._id, user: req.user._id, status: 'in_progress' }

  let attempt = await AssessmentAttempt.findOne(unfinished)
  let resumed = true

  if (!attempt) {
    resumed = false
    const startedAt = new Date()
    try {
      attempt = await AssessmentAttempt.create({
        user: req.user._id,
        assessment: assessment._id,
        startedAt,
        deadline: assessment.durationMinutes
          ? new Date(startedAt.getTime() + assessment.durationMinutes * 60_000)
          : undefined,
        totalMarks: assessment.totalMarks,
        ...expiryFor(req.user),
      })
    } catch (err) {
      if (err.code !== 11000) throw err
      attempt = await AssessmentAttempt.findOne(unfinished) // a double click started one already
      resumed = true
    }
  }

  res.status(resumed ? 200 : 201).json({ success: true, resumed, ...progressView(attempt, assessment) })
})

// GET /api/attempts/:id: the exam (no answers) while in progress, the full review once submitted
export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await findOwnedAttempt(req)
  const assessment = await loadAssessment(attempt)

  res.json({
    success: true,
    ...(attempt.status === 'in_progress' ? progressView(attempt, assessment) : reviewView(attempt, assessment)),
  })
})

// PATCH /api/attempts/:id/answers: autosave while the student works
export const saveAnswers = asyncHandler(async (req, res) => {
  const attempt = await findOwnedAttempt(req)
  if (attempt.status !== 'in_progress') throw new ApiError(409, 'This attempt has already been submitted')
  if (isExpired(attempt)) throw new ApiError(409, 'Time is up. Submit to see your results.')

  const assessment = await loadAssessment(attempt)
  const merged = mergeAnswers(attempt.answers, cleanAnswers(assessment, req.validated.body.answers))

  // The status filter means a save can never overwrite an attempt that was just submitted
  const saved = await AssessmentAttempt.updateOne(
    { _id: attempt._id, status: 'in_progress' },
    { $set: { answers: merged } },
  )
  if (!saved.matchedCount) throw new ApiError(409, 'This attempt has already been submitted')

  res.json({ success: true, savedAt: new Date().toISOString() })
})

// POST /api/attempts/:id/submit: grade the attempt (safe to call twice)
export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await findOwnedAttempt(req)
  const assessment = await loadAssessment(attempt)

  if (attempt.status === 'submitted') {
    return res.json({ success: true, ...reviewView(attempt, assessment) })
  }

  const now = new Date()
  // After the deadline plus grace period, only the answers already autosaved count
  const incoming = isExpired(attempt) ? [] : cleanAnswers(assessment, req.validated.body.answers)
  const answers = mergeAnswers(attempt.answers, incoming)

  const timedOut = Boolean(attempt.deadline && now > attempt.deadline)
  const endedAt = timedOut ? attempt.deadline : now

  // Only one request can win this claim, so a double submit grades once
  const claimed = await AssessmentAttempt.findOneAndUpdate(
    { _id: attempt._id, status: 'in_progress' },
    {
      $set: {
        status: 'submitted',
        answers,
        submittedAt: now,
        timeTakenSec: Math.max(0, Math.round((endedAt - attempt.startedAt) / 1000)),
        timedOut,
        gradingStatus: 'pending',
      },
    },
    { new: true },
  )

  if (!claimed) {
    const current = await AssessmentAttempt.findById(attempt._id)
    return res.json({ success: true, ...reviewView(current, assessment) })
  }

  // The attempt is already saved, so if grading fails it can be retried with /grade
  await finalizeGrading(claimed, assessment)
  res.json({ success: true, ...reviewView(claimed, assessment) })
})

// POST /api/attempts/:id/grade: retry answers that were waiting for the AI
export const regradeAttempt = asyncHandler(async (req, res) => {
  const attempt = await findOwnedAttempt(req)
  if (attempt.status !== 'submitted') throw new ApiError(409, 'Submit this attempt first')

  const assessment = await loadAssessment(attempt)
  if (attempt.gradingStatus === 'pending') await finalizeGrading(attempt, assessment)

  res.json({ success: true, ...reviewView(attempt, assessment) })
})