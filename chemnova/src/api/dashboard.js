import api, { getErrorMessage } from './client'

// Reads your real vivas and assessments. The browser's time zone makes the streak and the daily chart
// line up with your own calendar days.
export async function fetchDashboard() {
  let tz = 'UTC'
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    // keep UTC
  }

  try {
    const { data } = await api.get('/analytics/dashboard', { params: { tz } })
    return data.dashboard
  } catch (err) {
    throw new Error(getErrorMessage(err))
  }
}

// Only powers the "Preview with sample data" toggle. It never touches real data.
export function buildSampleDashboard() {
  const DAY = 86400000
  const now = Date.now()
  const ago = (ms) => new Date(now - ms).toISOString()

  const counts = [0, 1, 0, 2, 1, 3, 2, 0, 1, 2, 4, 2, 3, 5]
  const activity = counts.map((sessions, i) => ({
    label: new Date(now - (13 - i) * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions,
  }))

  const subjects = [
    { subject: 'Organic', score: 82 },
    { subject: 'Inorganic', score: 68 },
    { subject: 'Physical', score: 74 },
    { subject: 'Analytical', score: 59 },
    { subject: 'Spectroscopy', score: 71 },
  ]

  return {
    stats: { vivas: 12, assessments: 18, research: 2, streak: 5 },
    mastery: Math.round(subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length),
    activity,
    subjects,
    strong: [
      { name: 'Alkene reactions', score: 88 },
      { name: 'Periodic trends', score: 86 },
      { name: 'Acid-base equilibria', score: 83 },
    ],
    weak: [
      { name: 'Chemical kinetics', score: 46 },
      { name: 'NMR interpretation', score: 52 },
      { name: 'Thermodynamics', score: 58 },
    ],
    recent: [
      { id: 'r1', type: 'viva', title: 'Organic chemistry viva', subject: 'Organic', score: 78, date: ago(3 * 3600000) },
      { id: 'r2', type: 'assessment', title: 'Thermodynamics test', subject: 'Physical', score: 58, date: ago(DAY) },
      { id: 'r3', type: 'viva', title: 'Periodic trends rapid fire', subject: 'Inorganic', score: 86, date: ago(2 * DAY) },
      { id: 'r4', type: 'assessment', title: 'Spectroscopy mixed quiz', subject: 'Spectroscopy', score: 71, date: ago(4 * DAY) },
      { id: 'r5', type: 'assessment', title: 'Acid-base numericals', subject: 'Analytical', score: 83, date: ago(6 * DAY) },
    ],
    recommendations: [
      { id: 'p1', icon: 'assessment', title: 'Revise chemical kinetics', reason: 'Your lowest topic at 46%. Try a focused test.', to: '/assessments' },
      { id: 'p2', icon: 'viva', title: 'Viva on NMR interpretation', reason: 'A conversation can expose the gaps behind 52%.', to: '/viva' },
      { id: 'p3', icon: 'assessment', title: 'Protect your 5-day streak', reason: 'A quick test today keeps it going.', to: '/assessments' },
    ],
    earned: ['first-viva', 'first-test', 'streak-3', 'researcher'],
  }
}