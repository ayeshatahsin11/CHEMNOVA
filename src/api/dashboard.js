/*
 * TEMPORARY STUB, no backend yet.
 * fetchDashboard() returns an EMPTY dashboard, which is what a brand-new account sees.
 * In Phase 3 it becomes: return (await api.get('/analytics/dashboard')).data
 * The data shape below is what the real API will return.
 *
 * buildSampleDashboard() only powers the "Preview with sample data" toggle.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const starterRecommendations = [
  { id: 's1', icon: 'viva', title: 'Take your first viva', reason: 'A short session shows where you stand.', to: '/viva' },
  { id: 's2', icon: 'assessment', title: 'Try a quick test', reason: 'Build a 10-question test on what you are studying.', to: '/assessments' },
  { id: 's3', icon: 'companion', title: 'Ask the AI Companion', reason: 'Get any concept explained at your level.', to: '/companion' },
  { id: 's4', icon: 'game', title: 'Play a daily challenge', reason: 'A quick game to warm up.', to: '/fun-zone' },
]

const emptyDashboard = {
  stats: { vivas: 0, assessments: 0, research: 0, streak: 0 },
  mastery: null,
  activity: [],
  subjects: [],
  strong: [],
  weak: [],
  recent: [],
  recommendations: starterRecommendations,
  earned: [],
}

export async function fetchDashboard() {
  await wait(600)
  return emptyDashboard
}

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
      { id: 'p3', icon: 'game', title: 'Protect your 5-day streak', reason: "Today's challenge takes about 3 minutes.", to: '/fun-zone' },
    ],
    earned: ['first-viva', 'first-test', 'streak-3', 'researcher'],
  }
}