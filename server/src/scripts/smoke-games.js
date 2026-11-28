import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import GameRound from '../models/GameRound.js'
import { ELEMENTS, ELECTRONEGATIVITY } from '../data/elements.js'
import { MOLECULES } from '../data/molecules.js'
import { MYSTERY } from '../data/mystery.js'
import { GAMES, GAME_IDS } from '../config/games.js'
import { createRng, hashSeed, randomSeed } from '../services/games/rng.js'
import { generateQuestions } from '../services/games/generators.js'
import { gradeRound, maxScoreFor, mysteryPoints } from '../services/games/scoring.js'
import { waitForServer } from './waitForServer.js'
const BASE = `http://127.0.0.1:${env.port}/api`

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const check = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`)
const unique = (list) => new Set(list).size === list.length

// ---------- Part 1: data and game logic (no server needed) ----------
console.log('Part 1: data, question generators and scoring\n')

check('every element has a unique symbol and number', unique(ELEMENTS.map((e) => e.symbol)) && unique(ELEMENTS.map((e) => e.number)))
check(
  'every electronegativity value belongs to a known element',
  Object.keys(ELECTRONEGATIVITY).every((s) => ELEMENTS.some((e) => e.symbol === s)),
)
check('molecule names and formulas are unique', unique(MOLECULES.map((m) => m.name)) && unique(MOLECULES.map((m) => m.formula)))
check(
  'every mystery compound has 5 clues, ending with its formula',
  unique(MYSTERY.map((c) => c.name)) && MYSTERY.every((c) => c.clues.length === 5 && c.clues[4].includes(c.formula)),
)

function problems(game, questions) {
  const issues = []
  if (questions.length !== GAMES[game].questions) issues.push(`expected ${GAMES[game].questions} questions, got ${questions.length}`)

  const prompts = new Set()
  for (const q of questions) {
    if (!q.prompt || !q.explanation) issues.push('a question has no text or explanation')
      // Every mystery puzzle asks "Which compound am I?", so those are told apart by their answer instead
    const identity = q.kind === 'mystery' ? q.options[q.correctIndex] : q.prompt
    if (prompts.has(identity)) issues.push(`duplicate question: ${identity}`)
    prompts.add(identity)
    if (![2, 4].includes(q.options.length) || !unique(q.options)) issues.push(`bad options: ${q.prompt}`)
    if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length)) issues.push(`bad answer index: ${q.prompt}`)
    if (q.kind === 'mystery' && (q.clues?.length !== 5 || q.revealed !== 1)) issues.push('bad mystery clues')
  }
  return issues
}

for (const game of GAME_IDS) {
  let first = null
  for (let i = 0; i < 200 && !first; i++) {
    first = problems(game, generateQuestions(game, createRng(randomSeed())))[0] ?? null
  }
  check(`${GAMES[game].name}: 200 random rounds are all well-formed`, !first, first ?? '')
}

// Re-check the answers of trend questions against the data, using the rules independently
const byName = Object.fromEntries(ELEMENTS.map((e) => [e.name, e]))
let seen = 0
let wrong = 0
for (let i = 0; i < 200; i++) {
  for (const q of generateQuestions('battle', createRng(randomSeed()))) {
    const winner = byName[q.options[q.correctIndex]]
    const loser = byName[q.options[1 - q.correctIndex]]
    seen++

    if (q.prompt.startsWith('Which is more electronegative')) {
      if (!(ELECTRONEGATIVITY[winner.symbol] > ELECTRONEGATIVITY[loser.symbol])) wrong++
    } else if (q.prompt.startsWith('Which has the larger atomic radius')) {
      const ok = winner.group === loser.group ? winner.period > loser.period : winner.period === loser.period && winner.group < loser.group
      if (!ok) wrong++
    } else if (q.prompt.startsWith('Which has the higher first ionisation energy')) {
      if (!(winner.group === loser.group && winner.period < loser.period)) wrong++
    } else {
      wrong++
    }
  }
}
check('6000 battle questions all agree with the periodic trends', wrong === 0, `(${seen} checked, ${wrong} wrong)`)

const daily = (key) => JSON.stringify(generateQuestions('daily', createRng(hashSeed(`chemnova-daily-${key}`))))
check('the daily challenge is the same for the same date and different on another date', daily('2026-11-27') === daily('2026-11-27') && daily('2026-11-27') !== daily('2026-11-28'))

check('Element Match tops out at 170 points', maxScoreFor('element_match', 10) === 170)
check('Daily Challenge tops out at 100 and Mystery at 400', maxScoreFor('daily', 5) === 100 && maxScoreFor('mystery', 4) === 400)
check('mystery points fall from 100 to 20 as clues are revealed', [1, 2, 3, 4, 5].map(mysteryPoints).join() === '100,80,60,40,20')

const sample = generateQuestions('element_match', createRng(7)).map((q, i) => ({ ...q, _id: `q${i}` }))
const rightAll = new Map(sample.map((q) => [q._id, q.correctIndex]))
check('all correct scores the maximum', gradeRound({ game: 'element_match', questions: sample, choices: rightAll }).score === 170)

const oneWrong = new Map(rightAll)
oneWrong.set('q2', (sample[2].correctIndex + 1) % sample[2].options.length)
check('a wrong answer resets the streak bonus', gradeRound({ game: 'element_match', questions: sample, choices: oneWrong }).score === 132)
check('a limit counts only the first questions', gradeRound({ game: 'element_match', questions: sample, choices: rightAll, limit: 3 }).score === 36)

// ---------- Part 2: the API ----------
console.log('\nPart 2: the API\n')

await connectDB()
await waitForServer()
const emails = ['smoke.games.a@chemnova.dev', 'smoke.games.b@chemnova.dev']
let guestId = null

async function cleanup() {
  const users = await User.find({ email: { $in: emails } }).select('_id')
  const ids = [...users.map((u) => u._id), ...(guestId ? [guestId] : [])]
  await GameRound.deleteMany({ user: { $in: ids } })
  await User.deleteMany({ _id: { $in: ids } })
}
await cleanup()

const pw = 'Test1234'
let r = await call('POST', '/auth/register', { name: 'Games Alpha', email: emails[0], password: pw, level: 'Undergraduate' })
const tokenA = r.data.token
r = await call('POST', '/auth/register', { name: 'Games Beta', email: emails[1], password: pw, level: 'Undergraduate' })
const tokenB = r.data.token

// The test can read answer keys from the database, a player cannot
async function keyOf(roundId) {
  const doc = await GameRound.findById(roundId)
  return doc.questions.map((q) => ({ id: q.id, correct: q.correctIndex, size: q.options.length }))
}
const allRight = (key) => key.map((q) => ({ questionId: q.id, choice: q.correct }))
const allWrong = (key) => key.map((q) => ({ questionId: q.id, choice: (q.correct + 1) % q.size }))

const tz = 'Asia/Dhaka'

r = await call('GET', `/games/overview?tz=${tz}`)
check('the overview needs a login (401)', r.status === 401)

r = await call('GET', `/games/overview?tz=${tz}`, null, tokenA)
check(
  'a new player sees 5 games and a daily challenge not played yet',
  r.status === 200 && r.data.games?.length === 5 && r.data.daily?.state === 'new' && r.data.daily?.streak === 0,
)

r = await call('POST', '/games/chess/rounds', {}, tokenA)
check('an unknown game is rejected (400)', r.status === 400)

// ----- Element Match -----
r = await call('POST', '/games/element_match/rounds', {}, tokenA)
check('a round starts with 10 questions', r.status === 201 && r.data.questions?.length === 10)
const em1 = r.data.round?.id
const leaked = ['correctIndex', 'explanation', '"clues"']
check('no answer keys are sent while playing', leaked.every((k) => !JSON.stringify(r.data).includes(k)))

r = await call('GET', `/games/rounds/${em1}`, null, tokenB)
check("another player cannot open this round (404)", r.status === 404)
r = await call('POST', `/games/rounds/${em1}/submit`, { answers: [] }, tokenB)
check("another player cannot submit it (404)", r.status === 404)

const key1 = await keyOf(em1)
r = await call('POST', `/games/rounds/${em1}/submit`, { answers: [{ questionId: key1[0].id, choice: 9 }] }, tokenA)
check('an invalid choice is rejected (400)', r.status === 400)

r = await call('POST', `/games/rounds/${em1}/submit`, { answers: allRight(key1) }, tokenA)
check('all correct scores 170 and is a personal best', r.status === 200 && r.data.round?.score === 170 && r.data.personalBest === true)
check('the review shows the answers and explanations', r.data.review?.every((q) => q.correctIndex !== undefined && q.explanation && q.correct))

r = await call('POST', `/games/rounds/${em1}/submit`, { answers: allWrong(key1) }, tokenA)
check('submitting twice returns the same result', r.status === 200 && r.data.round?.score === 170)

r = await call('POST', '/games/element_match/rounds', {}, tokenA)
const key2 = await keyOf(r.data.round.id)
r = await call('POST', `/games/rounds/${r.data.round.id}/submit`, { answers: allWrong(key2) }, tokenA)
check('all wrong scores 0 and is not a personal best', r.data.round?.score === 0 && r.data.personalBest === false && r.data.previousBest === 170)

// ----- Periodic Table Battle -----
r = await call('POST', '/games/battle/rounds', {}, tokenA)
check('the battle has 30 two-option questions and a 60 second limit', r.data.questions?.length === 30 && r.data.round?.durationSec === 60 && r.data.questions.every((q) => q.options.length === 2))
let battleId = r.data.round.id
let battleKey = await keyOf(battleId)

r = await call('POST', `/games/rounds/${battleId}/submit`, { answers: allRight(battleKey) }, tokenA)
check('answers that arrive faster than a person could answer are not counted', r.status === 200 && r.data.round?.answered < 30, `(counted ${r.data.round?.answered} of 30)`)

r = await call('POST', '/games/battle/rounds', {}, tokenA)
battleId = r.data.round.id
battleKey = await keyOf(battleId)
await GameRound.updateOne({ _id: battleId }, { startedAt: new Date(Date.now() - 40_000) })
r = await call('POST', `/games/rounds/${battleId}/submit`, { answers: allRight(battleKey) }, tokenA)
check('30 answers in 40 seconds score the full amount', r.data.round?.score === maxScoreFor('battle', 30), `(score ${r.data.round?.score})`)

r = await call('POST', '/games/battle/rounds', {}, tokenA)
battleId = r.data.round.id
battleKey = await keyOf(battleId)
await GameRound.updateOne({ _id: battleId }, { startedAt: new Date(Date.now() - 200_000) })
r = await call('POST', `/games/rounds/${battleId}/submit`, { answers: allRight(battleKey) }, tokenA)
check('answers that arrive long after the time is up score 0 and are marked late', r.data.round?.score === 0 && r.data.round?.late === true && r.data.round?.answered === 0)

// ----- Mystery Compound -----
r = await call('POST', '/games/mystery/rounds', {}, tokenA)
const mystery = r.data.questions
const mysteryId = r.data.round?.id
check('a puzzle starts with exactly one clue', r.status === 201 && mystery?.length === 4 && mystery.every((q) => q.clues.length === 1 && q.clueCount === 5))

r = await call('POST', `/games/rounds/${mysteryId}/reveal`, { questionId: 'nope' }, tokenA)
check('revealing a clue for an unknown puzzle is rejected (404)', r.status === 404)

r = await call('POST', `/games/rounds/${mysteryId}/reveal`, { questionId: mystery[0].id }, tokenA)
check('revealing returns the second clue', r.status === 200 && r.data.revealed === 2 && r.data.worth === 80 && !!r.data.clue)
r = await call('POST', `/games/rounds/${mysteryId}/reveal`, { questionId: mystery[0].id }, tokenA)
check('revealing again returns the third clue', r.data.revealed === 3 && r.data.worth === 60)

r = await call('GET', `/games/rounds/${mysteryId}`, null, tokenA)
check('resuming shows the clues revealed so far', r.data.questions?.[0]?.clues?.length === 3 && r.data.questions?.[1]?.clues?.length === 1)

const mysteryKey = await keyOf(mysteryId)
r = await call('POST', `/games/rounds/${mysteryId}/submit`, { answers: allRight(mysteryKey) }, tokenA)
check('the score reflects the clues used (60 + 100 + 100 + 100)', r.data.round?.score === 360, `(score ${r.data.round?.score})`)
check('the review lists every clue', r.data.review?.[0]?.clues?.length === 5 && r.data.review?.[0]?.revealed === 3)

r = await call('POST', `/games/rounds/${mysteryId}/reveal`, { questionId: mystery[0].id }, tokenA)
check('clues cannot be revealed after the round (409)', r.status === 409)

r = await call('POST', '/games/mystery/rounds', {}, tokenA)
const again = r.data.questions[0].id
const againId = r.data.round.id
let last
for (let i = 0; i < 4; i++) last = await call('POST', `/games/rounds/${againId}/reveal`, { questionId: again }, tokenA)
check('a puzzle has 5 clues in total', last.data.revealed === 5 && last.data.worth === 20)
r = await call('POST', `/games/rounds/${againId}/reveal`, { questionId: again }, tokenA)
check('a sixth clue is refused (409)', r.status === 409)

// ----- Instant feedback (untimed games) -----
{
  r = await call('POST', '/games/molecule/rounds', {}, tokenA)
  const id = r.data.round.id
  const key = await keyOf(id)
  check('questions start unanswered', r.data.questions.every((q) => q.answered === false))

  r = await call('POST', `/games/rounds/${id}/check`, { questionId: key[0].id, choice: key[0].correct }, tokenA)
  check(
    'a right answer returns feedback, 15 points and a streak of 1',
    r.status === 200 && r.data.correct === true && r.data.points === 15 && r.data.streak === 1 && r.data.score === 15 && !!r.data.explanation,
  )

  r = await call('POST', `/games/rounds/${id}/check`, { questionId: key[0].id, choice: key[0].correct }, tokenA)
  check('a question cannot be answered twice (409)', r.status === 409)

  r = await call('POST', `/games/rounds/${id}/check`, { questionId: key[1].id, choice: (key[1].correct + 1) % key[1].size }, tokenA)
  check(
    'a wrong answer shows the right one and resets the streak',
    r.status === 200 && r.data.correct === false && r.data.correctIndex === key[1].correct && r.data.points === 0 && r.data.streak === 0,
  )

  r = await call('POST', `/games/rounds/${id}/check`, { questionId: 'nope', choice: 0 }, tokenA)
  check('checking an unknown question is rejected (404)', r.status === 404)
  r = await call('POST', `/games/rounds/${id}/check`, { questionId: key[2].id, choice: 7 }, tokenA)
  check('an out-of-range choice is rejected (400)', r.status === 400)
  r = await call('POST', `/games/rounds/${id}/check`, { questionId: key[2].id, choice: 0 }, tokenB)
  check('another player cannot check answers in this round (404)', r.status === 404)

  r = await call('GET', `/games/rounds/${id}`, null, tokenA)
  check(
    'resuming remembers answered questions, the streak and the score',
    r.data.questions[0].answered === true &&
      r.data.questions[1].answered === true &&
      r.data.questions[2].answered === false &&
      r.data.progress?.answered === 2 &&
      r.data.progress?.score === 15 &&
      r.data.progress?.streak === 0,
  )

  r = await call('POST', `/games/rounds/${id}/submit`, { answers: allRight(key) }, tokenA)
  check('a checked answer cannot be changed when finishing (score 210)', r.status === 200 && r.data.round?.score === 210, `(score ${r.data.round?.score})`)

  r = await call('POST', '/games/battle/rounds', {}, tokenA)
  const battleKey = await keyOf(r.data.round.id)
  r = await call('POST', `/games/rounds/${r.data.round.id}/check`, { questionId: battleKey[0].id, choice: 0 }, tokenA)
  check('timed rounds are not checked answer by answer (400)', r.status === 400)

  r = await call('POST', '/games/mystery/rounds', {}, tokenA)
  const mysteryRound = r.data.round.id
  const mysteryKey = await keyOf(mysteryRound)
  const puzzle = r.data.questions[0].id
  r = await call('POST', `/games/rounds/${mysteryRound}/check`, { questionId: puzzle, choice: mysteryKey[0].correct }, tokenA)
  check('a mystery answer scores by the clues shown (100 with one clue)', r.data.points === 100)
  r = await call('POST', `/games/rounds/${mysteryRound}/reveal`, { questionId: puzzle }, tokenA)
  check('no more clues after answering (409)', r.status === 409)
}

// ----- Daily Challenge -----
r = await call('POST', '/games/daily/rounds', { tz }, tokenA)
check('the daily challenge has 5 questions', r.status === 201 && r.data.questions?.length === 5)
const dailyA = r.data
const dailyKey = await keyOf(dailyA.round.id)

r = await call('POST', '/games/daily/rounds', { tz }, tokenA)
check('starting it again resumes the same round', r.status === 200 && r.data.resumed === true && r.data.round?.id === dailyA.round.id)

r = await call('POST', '/games/daily/rounds', { tz }, tokenB)
check('another player gets the same five questions', r.status === 201 && r.data.questions.map((q) => q.prompt).join('|') === dailyA.questions.map((q) => q.prompt).join('|'))

r = await call('POST', `/games/rounds/${dailyA.round.id}/submit`, { answers: allRight(dailyKey) }, tokenA)
check('all correct scores 100', r.data.round?.score === 100)

r = await call('POST', '/games/daily/rounds', { tz }, tokenA)
check('the challenge cannot be played twice in a day (409)', r.status === 409 && r.data.roundId === dailyA.round.id)

r = await call('GET', `/games/overview?tz=${tz}`, null, tokenA)
check('the overview shows the finished challenge and a streak of 1', r.data.daily?.state === 'finished' && r.data.daily?.score === 100 && r.data.daily?.streak === 1)
check('the overview shows your best scores', r.data.games?.find((g) => g.id === 'element_match')?.bestScore === 170)

// ----- Leaderboard -----
r = await call('GET', '/games/leaderboard?game=chess', null, tokenA)
check('an unknown game is rejected on the leaderboard (400)', r.status === 400)

r = await call('GET', '/games/leaderboard?game=element_match&period=week', null, tokenA)
check(
  'the leaderboard shows your best round with a shortened name',
  r.status === 200 && r.data.entries?.[0]?.name === 'Games A.' && r.data.entries[0].score === 170 && r.data.entries[0].rank === 1 && r.data.entries[0].isMe === true,
)

r = await call('POST', '/auth/guest')
const tokenG = r.data.token
guestId = r.data.user?.id
r = await call('POST', '/games/element_match/rounds', {}, tokenG)
const guestKey = await keyOf(r.data.round.id)
r = await call('POST', `/games/rounds/${r.data.round.id}/submit`, { answers: allRight(guestKey) }, tokenG)
check('a guest can play and score', r.status === 200 && r.data.round?.score === 170)

r = await call('GET', '/games/leaderboard?game=element_match&period=all', null, tokenG)
check('guests never appear on the leaderboard', r.data.entries?.length === 1 && r.data.entries[0].name === 'Games A.' && r.data.eligible === false)

await User.updateOne({ email: emails[0] }, { showOnLeaderboard: false })
r = await call('GET', '/games/leaderboard?game=element_match&period=all', null, tokenA)
check('a player who opts out is left off the leaderboard', r.data.entries?.length === 0 && r.data.eligible === false)

await cleanup()
console.log('\nTest data cleaned up')
await mongoose.disconnect()