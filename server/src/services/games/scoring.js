import { GAMES } from '../../config/games.js'

// Mystery Compound: 100 points with one clue, down to 20 with all five
export const mysteryPoints = (revealed) => Math.max(20, 120 - 20 * revealed)

const streakPoints = (cfg, streak) => cfg.points + Math.min(streak - 1, cfg.streakCap) * cfg.streakStep

export function maxScoreFor(game, count) {
  const cfg = GAMES[game]
  if (cfg.scoring === 'clues') return count * mysteryPoints(1)

  let total = 0
  for (let streak = 1; streak <= count; streak++) total += streakPoints(cfg, streak)
  return total
}

/**
 * Scores a round from the answers. choices maps question id to the chosen option.
 * Only the first `limit` questions can score (used to cap how many a timed round can fit in its time).
 */
export function gradeRound({ game, questions, choices, limit = Infinity }) {
  const cfg = GAMES[game]
  let streak = 0
  let score = 0
  let correct = 0
  let answered = 0

  const results = questions.map((q, i) => {
    const raw = i < limit ? choices.get(String(q._id)) : undefined
    const given = Number.isInteger(raw) && raw >= 0 && raw < q.options.length
    if (given) answered++

    const right = given && raw === q.correctIndex
    let points = 0

    if (right) {
      correct++
      streak++
      points = cfg.scoring === 'clues' ? mysteryPoints(q.revealed ?? 1) : streakPoints(cfg, streak)
    } else {
      streak = 0
    }

    score += points
    return {
      questionId: q._id,
      choice: given ? raw : null,
      correct: right,
      points,
      ...(q.kind === 'mystery' && { revealed: q.revealed }),
    }
  })

  return { results, score, correct, answered, maxScore: maxScoreFor(game, questions.length) }
}