export const GAMES = {
  element_match: {
    id: 'element_match',
    name: 'Element Match',
    description: 'Symbols, atomic numbers, groups, periods and element families.',
    questions: 10,
    durationSec: 0,
    scoring: 'streak',
    points: 10,
    streakStep: 2,
    streakCap: 5,
  },
  battle: {
    id: 'battle',
    name: 'Periodic Table Battle',
    description:
      'Sixty seconds, two elements at a time. Which has the higher electronegativity, the larger radius or the higher ionisation energy?',
    questions: 30,
    durationSec: 60,
    scoring: 'streak',
    points: 10,
    streakStep: 2,
    streakCap: 5,
  },
  molecule: {
    id: 'molecule',
    name: 'Guess the Molecule',
    description: 'Formulas, names, functional groups, shapes and polarity.',
    questions: 10,
    durationSec: 0,
    scoring: 'streak',
    points: 15,
    streakStep: 3,
    streakCap: 5,
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery Compound',
    description: 'Clues appear one at a time. The fewer you need, the more you score.',
    questions: 4,
    durationSec: 0,
    scoring: 'clues',
    points: 100,
    streakStep: 0,
    streakCap: 0,
  },
  daily: {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'Five mixed questions, the same for everyone, once a day. Keep your streak alive.',
    questions: 5,
    durationSec: 0,
    scoring: 'streak',
    points: 20,
    streakStep: 0,
    streakCap: 0,
    oncePerDay: true,
  },
}

export const GAME_IDS = Object.keys(GAMES)

export const GAME_LIMITS = {
  graceSec: 8, // extra seconds allowed for a timed round to reach the server
  minMsPerAnswer: 350, // a human cannot answer faster than this
}

export const LEADERBOARD = { size: 10 }