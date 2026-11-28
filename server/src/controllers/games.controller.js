import GameRound from '../models/GameRound.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { GAMES, GAME_IDS, GAME_LIMITS, LEADERBOARD } from '../config/games.js'
import { createRng, hashSeed, randomSeed } from '../services/games/rng.js'
import { generateQuestions } from '../services/games/generators.js'
import { gradeRound, maxScoreFor, mysteryPoints } from '../services/games/scoring.js'
import {
  dayKey as toDayKey,
  shiftDay,
  safeTimeZone,
  currentStreak,
  longestStreak,
} from '../services/analytics/dateUtils.js'

const DAY = 86_400_000

// What the browser may see while playing: no answers, no explanations, only the clues already revealed
const sanitize = (q) => ({
  id: q.id,
  kind: q.kind,
  prompt: q.prompt,
  options: q.options,
  tag: q.tag,
  answered: q.choice !== null && q.choice !== undefined,
  ...(q.kind === 'mystery' && { clues: q.clues.slice(0, q.revealed), clueCount: q.clues.length }),
})

// Where an unfinished round stands, worked out from the answers locked in so far
function standing(round) {
  const locked = new Map(
    round.questions.filter((q) => q.choice !== null && q.choice !== undefined).map((q) => [q.id, q.choice]),
  )
  const graded = gradeRound({ game: round.game, questions: round.questions, choices: locked })

  let streak = 0
  for (const r of graded.results) {
    if (r.choice === null) continue
    streak = r.correct ? streak + 1 : 0
  }
  return { locked, graded, streak }
}

function liveProgress(round) {
  const { locked, graded, streak } = standing(round)
  return { answered: locked.size, streak, score: graded.score }
}

const infoOf = (r) => ({
  id: r.id,
  game: r.game,
  status: r.status,
  startedAt: r.startedAt,
  durationSec: r.durationSec,
  serverNow: new Date().toISOString(), // lets the browser correct for a wrong clock
  total: r.questions.length,
  dayKey: r.dayKey ?? null,
})

const summaryOf = (r) => ({
  id: r.id,
  game: r.game,
  score: r.score,
  maxScore: r.maxScore,
  correct: r.correct,
  total: r.questions.length,
  answered: r.answered,
  durationMs: r.durationMs,
  finishedAt: r.finishedAt,
  dayKey: r.dayKey ?? null,
  late: r.late,
})

function reviewOf(round) {
  const byQuestion = new Map(round.results.map((r) => [String(r.questionId), r]))

  return round.questions.map((q) => {
    const r = byQuestion.get(q.id)
    return {
      id: q.id,
      kind: q.kind,
      prompt: q.prompt,
      options: q.options,
      tag: q.tag,
      correctIndex: q.correctIndex,
      choice: r?.choice ?? null,
      correct: r?.correct ?? false,
      points: r?.points ?? 0,
      explanation: q.explanation,
      ...(q.kind === 'mystery' && { clues: q.clues, revealed: q.revealed }),
    }
  })
}

const finishedView = (round) => ({
  success: true,
  round: summaryOf(round),
  personalBest: round.personalBest,
  previousBest: round.previousBest ?? null,
  review: reviewOf(round),
})

const resumeView = (round) => ({
  success: true,
  resumed: true,
  round: infoOf(round),
  questions: round.questions.map(sanitize),
  progress: liveProgress(round),
})

// The daily challenge belongs to the player's own calendar day
function playableDayKey(tz) {
  const utc = toDayKey(new Date(), 'UTC')
  const local = toDayKey(new Date(), tz)
  return [shiftDay(utc, -1), utc, shiftDay(utc, 1)].includes(local) ? local : utc
}

// "Aisha Khan" becomes "Aisha K."
function displayName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Player'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${[...parts[parts.length - 1]][0].toUpperCase()}.`
}

async function findOwnedRound(req) {
  const found = await GameRound.findOne({ _id: req.params.id, user: req.user._id })
  if (!found) throw new ApiError(404, 'Round not found')
  return found
}

const alreadyPlayed = (res, round) =>
  res.status(409).json({
    success: false,
    message: "You have already played today's challenge. Come back tomorrow!",
    roundId: round.id,
  })

// GET /api/games/overview?tz=Asia/Dhaka: everything the Fun Zone page needs in one call
export const getOverview = asyncHandler(async (req, res) => {
  const tz = safeTimeZone(req.validated.query.tz)
  const today = playableDayKey(tz)

  const [stats, dailyRounds] = await Promise.all([
    GameRound.aggregate([
      { $match: { user: req.user._id, status: 'finished' } },
      { $group: { _id: '$game', plays: { $sum: 1 }, best: { $max: '$score' }, last: { $max: '$finishedAt' } } },
    ]),
    GameRound.find({ user: req.user._id, game: 'daily' }).select('status dayKey score correct').lean(),
  ])
  const byGame = new Map(stats.map((s) => [s._id, s]))

  const games = GAME_IDS.map((id) => {
    const cfg = GAMES[id]
    const s = byGame.get(id)
    return {
      id,
      name: cfg.name,
      description: cfg.description,
      questions: cfg.questions,
      durationSec: cfg.durationSec,
      maxScore: maxScoreFor(id, cfg.questions),
      plays: s?.plays ?? 0,
      bestScore: s?.best ?? null,
      lastPlayedAt: s?.last ?? null,
    }
  })

  const finishedKeys = dailyRounds.filter((r) => r.status === 'finished').map((r) => r.dayKey)
  const todays = dailyRounds.find((r) => r.dayKey === today)
  const finished = todays?.status === 'finished'

  res.json({
    success: true,
    games,
    daily: {
      dayKey: today,
      state: !todays ? 'new' : finished ? 'finished' : 'active',
      roundId: todays ? String(todays._id) : null,
      score: finished ? todays.score : null,
      correct: finished ? todays.correct : null,
      total: GAMES.daily.questions,
      maxScore: maxScoreFor('daily', GAMES.daily.questions),
      streak: currentStreak(finishedKeys, today),
      bestStreak: longestStreak(finishedKeys),
    },
  })
})

// POST /api/games/:game/rounds: start a round and get the questions
export const startRound = asyncHandler(async (req, res) => {
  const { game } = req.validated.params
  const cfg = GAMES[game]
  const user = req.user
  const tz = safeTimeZone(req.validated.body.tz)
  const dayKey = cfg.oncePerDay ? playableDayKey(tz) : undefined

  if (cfg.oncePerDay) {
    const existing = await GameRound.findOne({ user: user._id, game, dayKey })
    if (existing?.status === 'finished') return alreadyPlayed(res, existing)
    if (existing) return res.json(resumeView(existing))
  } else {
    // Starting again abandons any unfinished round of the same game
    await GameRound.deleteMany({ user: user._id, game, status: 'active' })
  }

  // Everyone gets the same daily questions for the same date. Other games are random.
  const rng = createRng(cfg.oncePerDay ? hashSeed(`chemnova-daily-${dayKey}`) : randomSeed())
  const questions = generateQuestions(game, rng)
  if (!questions.length) throw new ApiError(500, 'Could not prepare this game. Please try again.')

  const now = new Date()
  let round

  try {
    round = await GameRound.create({
      user: user._id,
      game,
      status: 'active',
      guest: Boolean(user.isGuest),
      dayKey,
      startedAt: now,
      durationSec: cfg.durationSec,
      questions,
      expiresAt: user.isGuest && user.expiresAt ? user.expiresAt : new Date(now.getTime() + DAY),
    })
  } catch (err) {
    if (err.code !== 11000 || !cfg.oncePerDay) throw err
    // Two requests started today's challenge at the same moment
    round = await GameRound.findOne({ user: user._id, game, dayKey })
    if (!round) throw err
    return round.status === 'finished' ? alreadyPlayed(res, round) : res.json(resumeView(round))
  }

  res.status(201).json({
    success: true,
    resumed: false,
    round: infoOf(round),
    questions: round.questions.map(sanitize),
  })
})

// GET /api/games/rounds/:id
export const getRound = asyncHandler(async (req, res) => {
  const round = await findOwnedRound(req)
  if (round.status === 'finished') return res.json(finishedView(round))
   res.json({
    success: true,
    round: infoOf(round),
    questions: round.questions.map(sanitize),
    progress: liveProgress(round),
  })
})

// POST /api/games/rounds/:id/reveal: show the next clue of a mystery puzzle
export const revealClue = asyncHandler(async (req, res) => {
  const { questionId } = req.validated.body
  const round = await findOwnedRound(req)

  if (round.status !== 'active') throw new ApiError(409, 'This round has already finished')

  const q = round.questions.find((x) => x.id === questionId)
  if (!q || q.kind !== 'mystery') throw new ApiError(404, 'That puzzle was not found in this round')
      if (q.choice !== null && q.choice !== undefined) throw new ApiError(409, 'You have already answered this puzzle')
  if (q.revealed >= q.clues.length) throw new ApiError(409, 'Every clue is already revealed')

  // Matching on the current count means a double click reveals one clue, not two
  const updated = await GameRound.findOneAndUpdate(
    { _id: round._id, status: 'active', questions: { $elemMatch: { _id: q._id, revealed: q.revealed, choice: null } } },
    { $inc: { 'questions.$.revealed': 1 } },
    { new: true },
  )
  if (!updated) throw new ApiError(409, 'That clue was already revealed')

  const fresh = updated.questions.id(q._id)
  res.json({
    success: true,
    clue: fresh.clues[fresh.revealed - 1],
    revealed: fresh.revealed,
    clueCount: fresh.clues.length,
    worth: mysteryPoints(fresh.revealed), // what a correct answer is worth now
  })
})

// POST /api/games/rounds/:id/check: lock in an answer and get instant feedback (untimed games only)
export const checkAnswer = asyncHandler(async (req, res) => {
  const { questionId, choice } = req.validated.body
  const round = await findOwnedRound(req)

  if (round.status !== 'active') throw new ApiError(409, 'This round has already finished')
  if (round.durationSec > 0) throw new ApiError(400, 'Answers in a timed round are checked when you finish')

  const q = round.questions.find((x) => x.id === questionId)
  if (!q) throw new ApiError(404, 'Question not found in this round')
  if (choice >= q.options.length) throw new ApiError(400, 'That option does not exist')
  if (q.choice !== null && q.choice !== undefined) throw new ApiError(409, 'That question was already answered')

  // Only one request can lock an answer, so a double click cannot change it
  const locked = await GameRound.findOneAndUpdate(
    { _id: round._id, status: 'active', questions: { $elemMatch: { _id: q._id, choice: null } } },
    { $set: { 'questions.$.choice': choice } },
    { new: true },
  )
  if (!locked) throw new ApiError(409, 'That question was already answered')

  const { graded, streak } = standing(locked)
  const mine = graded.results[locked.questions.findIndex((x) => x.id === questionId)]

  res.json({
    success: true,
    correct: mine.correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    points: mine.points,
    streak,
    score: graded.score,
  })
})
// POST /api/games/rounds/:id/submit: score the round (safe to call twice)
export const submitRound = asyncHandler(async (req, res) => {
  const round = await findOwnedRound(req)
  if (round.status === 'finished') return res.json(finishedView(round))

  const now = new Date()
  const elapsedMs = now - round.startedAt

  // A timed round cannot be answered faster than a person could, and answers that arrive long
  // after the time is up are not counted
  const timed = round.durationSec > 0
  const late = timed && elapsedMs > (round.durationSec + GAME_LIMITS.graceSec) * 1000
  const limit = !timed ? Infinity : late ? 0 : Math.floor(elapsedMs / GAME_LIMITS.minMsPerAnswer)

  const choices = new Map(req.validated.body.answers.map((a) => [a.questionId, a.choice]))
    // An answer that was checked during play is locked in and cannot be changed at the end
  for (const q of round.questions) {
    if (q.choice !== null && q.choice !== undefined) choices.set(q.id, q.choice)
  }
  const graded = gradeRound({ game: round.game, questions: round.questions, choices, limit })

  const prior = await GameRound.findOne({ user: round.user, game: round.game, status: 'finished' })
    .sort({ score: -1 })
    .select('score')
    .lean()
  const personalBest = graded.score > 0 && graded.score > (prior?.score ?? 0)

  // Only one request can win this claim, so a double submit scores once
  const claimed = await GameRound.findOneAndUpdate(
    { _id: round._id, status: 'active' },
    {
      $set: {
        status: 'finished',
        finishedAt: now,
        durationMs: elapsedMs,
        late,
        results: graded.results,
        score: graded.score,
        maxScore: graded.maxScore,
        correct: graded.correct,
        answered: graded.answered,
        personalBest,
        previousBest: prior?.score ?? null,
      },
      // Finished rounds are kept as history, except guests' rounds, which expire with the guest
      ...(!round.guest && { $unset: { expiresAt: '' } }),
    },
    { new: true },
  )

  if (!claimed) return res.json(finishedView(await GameRound.findById(round._id)))
  res.json(finishedView(claimed))
})

// GET /api/games/leaderboard?game=battle&period=week
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { game, period } = req.validated.query

  const match = {
    game,
    status: 'finished',
    guest: false,
    score: { $gt: 0 },
    ...(period === 'week' && { finishedAt: { $gte: new Date(Date.now() - 7 * DAY) } }),
  }

  // Each player's best round, leaving out anyone who chose not to appear
  const rows = await GameRound.aggregate([
    { $match: match },
    { $sort: { score: -1, finishedAt: 1 } },
    { $group: { _id: '$user', score: { $first: '$score' }, at: { $first: '$finishedAt' } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $match: { 'u.showOnLeaderboard': { $ne: false } } },
    { $project: { score: 1, at: 1, name: '$u.name' } },
    { $sort: { score: -1, at: 1 } },
    { $limit: 1000 },
  ])

  // Equal scores share a rank
  const entries = rows.map((row) => ({
    userId: String(row._id),
    name: displayName(row.name),
    score: row.score,
    rank: 1 + rows.filter((x) => x.score > row.score).length,
  }))

  const me = String(req.user._id)
  const top = entries.slice(0, LEADERBOARD.size).map(({ userId, ...entry }) => ({ ...entry, isMe: userId === me }))
  const mine = entries.find((e) => e.userId === me)

  res.json({
    success: true,
    game,
    period,
    eligible: !req.user.isGuest && req.user.showOnLeaderboard !== false,
    entries: top,
    me: mine && !top.some((e) => e.isMe) ? { rank: mine.rank, score: mine.score } : null,
    total: entries.length,
  })
})