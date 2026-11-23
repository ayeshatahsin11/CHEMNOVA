const round1 = (n) => Math.round(n * 10) / 10
const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)

// Four 0-10 marks -> one 0-100 score
export const questionOverall = (s) =>
  round1(mean([s.accuracy, s.understanding, s.explanation, s.reasoning]) * 10)

export function gradeLabel(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs work'
}

// questions = the ANSWERED questions of one session (a skipped question counts as 0)
export function computeStats(questions) {
  const dim = (key) => round1(mean(questions.map((q) => q.scores[key])) * 10)
  const overall = round1(mean(questions.map((q) => q.overall)))

  // Group by topic tag, ignoring case
  const byTopic = new Map()
  for (const q of questions) {
    const name = (q.topicTag || 'General').trim() || 'General'
    const key = name.toLowerCase()
    const entry = byTopic.get(key) ?? { name, scores: [] }
    entry.scores.push(q.overall)
    byTopic.set(key, entry)
  }

  const topicScores = [...byTopic.values()].map((t) => ({
    name: t.name,
    score: round1(mean(t.scores)),
    questions: t.scores.length,
  }))

  return {
    answered: questions.length,
    skipped: questions.filter((q) => q.skipped).length,
    overall,
    grade: gradeLabel(overall),
    accuracy: dim('accuracy'),
    understanding: dim('understanding'),
    explanation: dim('explanation'),
    reasoning: dim('reasoning'),
    topicScores,
    strongTopics: topicScores
      .filter((t) => t.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    weakTopics: topicScores
      .filter((t) => t.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
  }
}

// Used when the AI cannot write the report text, so the student still gets a useful report
export function fallbackNarrative(stats, questions) {
  const misconceptions = questions.map((q) => q.misconception).filter(Boolean)

  const summary =
    `You scored ${stats.overall}% overall (${stats.grade}). ` +
    (stats.strongTopics.length ? `Your strongest area was ${stats.strongTopics[0].name}. ` : '') +
    (stats.weakTopics.length
      ? `Focus next on ${stats.weakTopics[0].name}.`
      : 'Keep practising with harder questions to push your score higher.')

  const improvementAreas = [
    ...stats.weakTopics.map((t) => `Revisit ${t.name}: you scored ${t.score}% on it.`),
    ...misconceptions.slice(0, 3),
  ].slice(0, 5)
  if (!improvementAreas.length) {
    improvementAreas.push('Try a higher difficulty to find the gaps in your knowledge.')
  }

  const lowest = [...stats.topicScores].sort((a, b) => a.score - b.score)[0]
  const revision = stats.weakTopics.length
    ? stats.weakTopics.map((t) => ({ title: t.name, why: `Your answers on this topic scored ${t.score}%.` }))
    : lowest
      ? [{ title: lowest.name, why: 'This was your lowest-scoring topic in this exam.' }]
      : []

  return { summary, improvementAreas, revision }
}