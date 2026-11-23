import VivaSession from '../models/VivaSession.js'
import VivaQuestion from '../models/VivaQuestion.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { LEVELS, GUEST_LIMITS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES, INPUT_MODES, VIVA_MODES, VIVA_LIMITS } from '../config/viva.js'
import {
  generateOpeningQuestion,
  generateNextAfterSkip,
  evaluateAnswer,
  writeReportNarrative,
} from '../services/viva/vivaService.js'
import { questionOverall, computeStats, fallbackNarrative } from '../services/viva/scoring.js'

const expiryFor = (user) => (user.isGuest && user.expiresAt ? { expiresAt: user.expiresAt } : {})

const ZERO_SCORES = { accuracy: 0, understanding: 0, explanation: 0, reasoning: 0 }
const SKIPPED_FEEDBACK = 'You skipped this question.'

async function findOwnedSession(req) {
  const session = await VivaSession.findOne({ _id: req.params.id, user: req.user._id })
  if (!session) throw new ApiError(404, 'Viva session not found')
  return session
}

async function createNextQuestion(session, user, order, data) {
  try {
    return await VivaQuestion.create({
      session: session._id,
      user: user._id,
      order,
      question: data.question,
      topicTag: data.topicTag,
      isFollowUp: Boolean(data.isFollowUp),
      ...expiryFor(user),
    })
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'That answer was already submitted')
    throw err
  }
}

// GET /api/viva/options: everything the setup form needs, so the frontend never duplicates these lists
export const getOptions = (req, res) => {
  const guest = req.user.isGuest
  const maxQuestions = guest ? GUEST_LIMITS.vivaMaxQuestions : VIVA_LIMITS.maxQuestions

  res.json({
    success: true,
    options: {
      subjects: SUBJECTS,
      levels: LEVELS,
      difficulties: DIFFICULTIES,
      inputModes: INPUT_MODES,
      modes: Object.entries(VIVA_MODES).map(([id, m]) => ({
        id,
        label: m.label,
        description: m.description,
      })),
      limits: {
        minQuestions: VIVA_LIMITS.minQuestions,
        maxQuestions,
        defaultQuestions: Math.min(VIVA_LIMITS.defaultQuestions, maxQuestions),
        maxAnswerChars: VIVA_LIMITS.maxAnswerChars,
        maxTopicChars: VIVA_LIMITS.maxTopicChars,
      },
      guest: guest ? { sessions: GUEST_LIMITS.vivaSessions } : null,
    },
  })
}

// GET /api/viva/sessions: history (guests are not saved, so they get an empty list)
export const listSessions = asyncHandler(async (req, res) => {
  if (req.user.isGuest) return res.json({ success: true, sessions: [] })

  const sessions = await VivaSession.find({ user: req.user._id })
    .select('-report')
    .sort({ createdAt: -1 })
    .limit(30)

  res.json({ success: true, sessions })
})

// POST /api/viva/sessions: start an exam and get the first question
export const createSession = asyncHandler(async (req, res) => {
  const config = req.validated.body
  const guest = req.user.isGuest

  if (guest) {
    if (config.totalQuestions > GUEST_LIMITS.vivaMaxQuestions) {
      throw new ApiError(
        403,
        `Guests can take a viva of up to ${GUEST_LIMITS.vivaMaxQuestions} questions. Create a free account for longer exams.`,
      )
    }
    const used = await VivaSession.countDocuments({ user: req.user._id })
    if (used >= GUEST_LIMITS.vivaSessions) {
      throw new ApiError(403, 'Guests can take one viva session. Create a free account to continue.')
    }
  }

  const session = await VivaSession.create({ ...config, user: req.user._id, ...expiryFor(req.user) })

  try {
    const first = await generateOpeningQuestion(config)
    const question = await VivaQuestion.create({
      session: session._id,
      user: req.user._id,
      order: 1,
      question: first.question,
      topicTag: first.topicTag,
      ...expiryFor(req.user),
    })

    res.status(201).json({
      success: true,
      session,
      question,
      progress: { answered: 0, total: session.totalQuestions },
    })
  } catch (err) {
    // Do not leave an empty session behind (it would also use up a guest's only session)
    await VivaQuestion.deleteMany({ session: session._id })
    await VivaSession.deleteOne({ _id: session._id })
    throw err
  }
})

// GET /api/viva/sessions/:id: the whole session, for resuming or reviewing
export const getSession = asyncHandler(async (req, res) => {
  const session = await findOwnedSession(req)
  const questions = await VivaQuestion.find({ session: session._id }).sort({ order: 1 })

  res.json({
    success: true,
    session,
    questions,
    progress: {
      answered: questions.filter((q) => q.answeredAt).length,
      total: session.totalQuestions,
    },
  })
})

// POST /api/viva/sessions/:id/answer
//   { skip: true }   -> marks the question as skipped (it stays open so the student can come back)
//                       and creates the next question. No evaluation, so no scoring.
//   { answer: '...' } -> evaluates the answer. If this was the newest question, it also creates the next one.
//                       Answering an earlier, skipped question only evaluates it.
export const answerQuestion = asyncHandler(async (req, res) => {
  const { questionId, answer, skip } = req.validated.body
  const session = await findOwnedSession(req)

  if (session.status !== 'active') throw new ApiError(409, 'This viva has already finished')

  const questions = await VivaQuestion.find({ session: session._id }).sort({ order: 1 })
  const current = questions.find((q) => q.id === questionId)
  if (!current) throw new ApiError(404, 'Question not found in this session')
  if (current.answeredAt) throw new ApiError(409, 'That question was already answered')

  const answered = questions.filter((q) => q.answeredAt)
  const asked = questions.map((q) => q.question)

  // Only the newest question can lead to a new one, and only while the exam still has questions to create
  const needsNext = current.order === questions.length && questions.length < session.totalQuestions

  // ---- skip ----
  if (skip) {
    if (current.skipped) throw new ApiError(409, 'That question was already skipped')

    // Generate the next question first, so a failed AI call changes nothing and the student can simply retry
    const next = needsNext
      ? await generateNextAfterSkip({
          config: session.toObject(),
          answered,
          asked,
          number: current.order + 1,
        })
      : null

    // The filter makes a double submit safe: only one request can win
    const skippedQuestion = await VivaQuestion.findOneAndUpdate(
      { _id: current._id, answeredAt: null, skipped: false },
      { $set: { skipped: true } },
      { new: true },
    )
    if (!skippedQuestion) throw new ApiError(409, 'That question was already skipped')

    const nextQuestion = next ? await createNextQuestion(session, req.user, current.order + 1, next) : null

    return res.json({
      success: true,
      skippedQuestion,
      next: nextQuestion,
      progress: { answered: answered.length, total: session.totalQuestions },
    })
  }

  // ---- answer ----
  const { evaluation, next } = await evaluateAnswer({
    config: session.toObject(),
    answered,
    asked,
    current,
    answer,
    skipped: false,
    isLast: !needsNext,
  })

  const scores = {
    accuracy: evaluation.accuracy,
    understanding: evaluation.understanding,
    explanation: evaluation.explanation,
    reasoning: evaluation.reasoning,
  }

  const evaluated = await VivaQuestion.findOneAndUpdate(
    { _id: current._id, answeredAt: null },
    {
      $set: {
        answer,
        skipped: false, // answering a question that was skipped earlier clears the skip
        scores,
        overall: questionOverall(scores),
        feedback: evaluation.feedback,
        misconception: evaluation.misconception,
        answeredAt: new Date(),
      },
    },
    { new: true },
  )
  if (!evaluated) throw new ApiError(409, 'That question was already answered')

  const nextQuestion = next ? await createNextQuestion(session, req.user, current.order + 1, next) : null

  res.json({
    success: true,
    evaluated,
    next: nextQuestion,
    progress: { answered: answered.length + 1, total: session.totalQuestions },
  })
})

// POST /api/viva/sessions/:id/finish: build the final report (safe to call twice)
export const finishSession = asyncHandler(async (req, res) => {
  const session = await findOwnedSession(req)
  if (session.status === 'completed') return res.json({ success: true, session })

  const all = await VivaQuestion.find({ session: session._id }).sort({ order: 1 })

  const realAnswers = all.filter((q) => q.answeredAt && !q.skipped).length
  if (!realAnswers) throw new ApiError(400, 'Answer at least one question before finishing')

  // Skipped questions the student never came back to count as 0.
  // They are built in memory here and saved only after the report succeeds.
  const counted = all
    .filter((q) => q.answeredAt || q.skipped)
    .map((q) =>
      q.answeredAt
        ? q
        : {
            order: q.order,
            question: q.question,
            topicTag: q.topicTag,
            skipped: true,
            answer: '',
            scores: ZERO_SCORES,
            overall: 0,
            feedback: SKIPPED_FEEDBACK,
            misconception: null,
          },
    )

  const stats = computeStats(counted)
  const log = counted.map((q) => ({
    n: q.order,
    question: q.question,
    answer: q.skipped ? '(skipped)' : String(q.answer || '').slice(0, 300),
    score: q.overall,
    feedback: q.feedback,
    misconception: q.misconception || null,
    topic: q.topicTag,
  }))

  let narrative
  try {
    narrative = await writeReportNarrative({ config: session.toObject(), stats, log })
  } catch (err) {
    console.warn('[viva] report text from AI failed, using the automatic version:', err.message)
    narrative = { ...fallbackNarrative(stats, counted), source: 'auto' }
  }

  const completedAt = new Date()
  session.report = {
    ...stats,
    summary: narrative.summary,
    improvementAreas: narrative.improvementAreas,
    revision: narrative.revision,
    narrativeSource: narrative.source,
    durationSec: Math.round((completedAt - session.createdAt) / 1000),
  }
  session.score = stats.overall
  session.status = 'completed'
  session.completedAt = completedAt
  await session.save()

  // Make the skipped questions final (score 0), then drop any question that was never attempted
  await VivaQuestion.updateMany(
    { session: session._id, skipped: true, answeredAt: null },
    { $set: { scores: { ...ZERO_SCORES }, overall: 0, feedback: SKIPPED_FEEDBACK, answeredAt: completedAt } },
  )
  await VivaQuestion.deleteMany({ session: session._id, answeredAt: null })

  res.json({ success: true, session })
})

// DELETE /api/viva/sessions/:id
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await findOwnedSession(req)
  await VivaQuestion.deleteMany({ session: session._id })
  await session.deleteOne()
  res.json({ success: true })
})