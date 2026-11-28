import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import VivaSession from '../models/VivaSession.js'
import Assessment from '../models/Assessment.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import { shiftDay, lastDays, currentStreak, longestStreak } from '../services/analytics/dateUtils.js'
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// ---------- Part 1: date logic ----------
console.log('Part 1: date and streak logic\n')

check('shiftDay crosses month and year ends', shiftDay('2026-11-30', 1) === '2026-12-01' && shiftDay('2026-03-01', -1) === '2026-02-28')
check('lastDays lists days oldest first', same(lastDays('2026-11-26', 3), ['2026-11-24', '2026-11-25', '2026-11-26']))
check('streak counts days in a row', currentStreak(['2026-11-24', '2026-11-25', '2026-11-26'], '2026-11-26') === 3)
check('a streak stays alive until the end of today', currentStreak(['2026-11-24', '2026-11-25'], '2026-11-26') === 2)
check('a gap ends the streak', currentStreak(['2026-11-20'], '2026-11-26') === 0)
check('longest streak', longestStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10']) === 3)

// ---------- Part 2: the API with known data ----------
console.log('\nPart 2: the API\n')

await connectDB()
await waitForServer()
const email = 'smoke.analytics@chemnova.dev'
let guestId = null

async function cleanup() {
  const user = await User.findOne({ email }).select('_id')
  const ids = [...(user ? [user._id] : []), ...(guestId ? [guestId] : [])]
  await AssessmentAttempt.deleteMany({ user: { $in: ids } })
  await Assessment.deleteMany({ user: { $in: ids } })
  await VivaSession.deleteMany({ user: { $in: ids } })
  await User.deleteMany({ _id: { $in: ids } })
}
await cleanup()

let r = await call('POST', '/auth/register', { name: 'Analytics Test', email, password: 'Test1234', level: 'Undergraduate' })
const token = r.data.token
const userId = r.data.user.id

const path = '/analytics/dashboard?tz=Asia/Dhaka'

r = await call('GET', '/analytics/dashboard')
check('the dashboard needs a login (401)', r.status === 401)

r = await call('GET', path, null, token)
check(
  'a new account gets an empty dashboard with starter recommendations',
  r.status === 200 &&
    r.data.dashboard.stats.vivas === 0 &&
    r.data.dashboard.mastery === null &&
    r.data.dashboard.recommendations.some((x) => x.id === 'first-viva'),
)

// Known history (timestamps are relative to now, so avoid running this within a minute of midnight)
const DAY = 86_400_000
const ago = (days) => new Date(Date.now() - days * DAY - 60_000)

const base = { user: userId, level: 'Undergraduate', difficulty: 'Intermediate', mode: 'university', totalQuestions: 3 }

await VivaSession.create({
  ...base,
  subject: 'Organic Chemistry',
  status: 'completed',
  score: 80,
  completedAt: ago(0),
  report: {
    topicScores: [
      { name: 'SN2 mechanism', score: 90, questions: 2 },
      { name: 'Alkenes', score: 50, questions: 1 },
    ],
  },
})
await VivaSession.create({ ...base, subject: 'Organic Chemistry', status: 'completed', score: 60, completedAt: ago(1), report: { topicScores: [] } })
const unfinished = await VivaSession.create({ ...base, subject: 'Spectroscopy', status: 'active' })

const assessment = await Assessment.create({
  user: userId,
  title: 'Physical Chemistry: pH',
  subject: 'Physical Chemistry',
  level: 'Undergraduate',
  difficulty: 'Intermediate',
  types: ['mcq'],
  requestedQuestions: 3,
  questionCount: 3,
  totalMarks: 3,
  durationMinutes: 0,
  questions: [],
})
await AssessmentAttempt.create({
  user: userId,
  assessment: assessment._id,
  status: 'submitted',
  startedAt: ago(2),
  submittedAt: ago(2),
  gradingStatus: 'complete',
  score: 40,
  report: { topicScores: [{ name: 'Acids and bases', score: 40, questions: 3 }] },
})
await AssessmentAttempt.create({
  user: userId,
  assessment: assessment._id,
  status: 'submitted',
  startedAt: ago(4),
  submittedAt: ago(4),
  gradingStatus: 'pending',
  score: 10,
  report: { topicScores: [{ name: 'Ignored topic', score: 10, questions: 5 }] },
})

r = await call('GET', path, null, token)
const d = r.data.dashboard

check('stats count finished work only', d?.stats?.vivas === 2 && d?.stats?.assessments === 2 && d?.stats?.research === 0, JSON.stringify(d?.stats))
check('streak counts today, yesterday and the day before (3)', d?.stats?.streak === 3)
check(
  'subject averages are right',
  d?.subjects?.find((s) => s.subject === 'Organic')?.score === 70 && d?.subjects?.find((s) => s.subject === 'Physical')?.score === 40,
)
check('mastery is the average of subjects (55)', d?.mastery === 55)
check('assessments still waiting for grading are left out of scores', !JSON.stringify(d).includes('Ignored topic'))
check('strong topics: SN2 mechanism at 90', same(d?.strong, [{ name: 'SN2 mechanism', score: 90 }]))
check(
  'weak topics are listed lowest first',
  same(d?.weak, [{ name: 'Acids and bases', score: 40 }, { name: 'Alkenes', score: 50 }]),
)
check('activity covers 14 days and totals 4 sessions', d?.activity?.length === 14 && d.activity.reduce((n, x) => n + x.sessions, 0) === 4)
check(
  'recent shows 3 scored sessions, newest first, with links',
  d?.recent?.length === 3 && d.recent[0].type === 'viva' && d.recent[0].score === 80 && d.recent[0].to.startsWith('/viva/'),
)
check(
  'the unfinished viva is recommended first',
  d?.recommendations?.[0]?.id === 'resume-viva' && d.recommendations[0].to === `/viva/${unfinished._id}`,
)
check(
  'the weakest topic is recommended',
  d?.recommendations?.some((x) => x.id === 'weak-test' && x.title.includes('Acids and bases')),
)
check(
  'badges: first viva, first test and streak, but not Sharp Mind',
  ['first-viva', 'first-test', 'streak-3'].every((b) => d?.earned?.includes(b)) && !d?.earned?.includes('sharp'),
  JSON.stringify(d?.earned),
)

r = await call('GET', '/analytics/dashboard?tz=Mars/Base', null, token)
check('an invalid time zone falls back safely (200)', r.status === 200)

r = await call('POST', '/auth/guest')
guestId = r.data.user?.id
r = await call('GET', path, null, r.data.token)
check('guests get an empty dashboard', r.status === 200 && r.data.dashboard.stats.vivas === 0 && r.data.dashboard.mastery === null)

await cleanup()
console.log('\nTest data cleaned up')
await mongoose.disconnect()