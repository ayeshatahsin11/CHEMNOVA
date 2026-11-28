import { Atom, Swords, Hexagon, Search, CalendarCheck } from 'lucide-react'

export const gameMeta = {
  daily: {
    name: 'Daily Challenge',
    icon: CalendarCheck,
    gradient: 'from-amber-400 to-pink-500',
    rules: [
      '5 mixed questions on elements, trends and molecules, the same for everyone today.',
      'Each correct answer scores 20 points, so 100 is the maximum.',
      'You get one attempt per day. Finish one every day to build your streak.',
      'Your day follows your own time zone.',
    ],
  },
  element_match: {
    name: 'Element Match',
    icon: Atom,
    gradient: 'from-cyan-400 to-blue-500',
    rules: [
      '10 questions on symbols, atomic numbers, groups, periods and element families.',
      'Each correct answer scores 10 points. Every answer in a row adds a streak bonus of +2, up to +10.',
      'After every question you see the right answer and a short explanation.',
      'Press 1 to 4 to answer quickly.',
    ],
  },
  battle: {
    name: 'Periodic Table Battle',
    icon: Swords,
    gradient: 'from-violet-400 to-fuchsia-500',
    rules: [
      '60 seconds, two elements at a time. Pick the one with the higher electronegativity, the larger atomic radius or the higher ionisation energy, as each question asks.',
      'Each correct answer scores 10 points, with a streak bonus of +2 for every answer in a row, up to +10.',
      'Your answers are checked when time is up, so keep going. Use the ← and → keys, or 1 and 2.',
      'The clock runs on our server, so it cannot be paused or slowed.',
    ],
  },
  molecule: {
    name: 'Guess the Molecule',
    icon: Hexagon,
    gradient: 'from-emerald-400 to-cyan-500',
    rules: [
      '10 questions on formulas, names, functional groups, shapes and polarity.',
      'Each correct answer scores 15 points, with a streak bonus of +3 for every answer in a row, up to +15.',
      'After every question you see the right answer and a short explanation.',
      'Press 1 to 4 to answer quickly.',
    ],
  },
  mystery: {
    name: 'Mystery Compound',
    icon: Search,
    gradient: 'from-pink-400 to-violet-500',
    rules: [
      '4 puzzles. You start with one clue and must name the compound.',
      'Reveal more clues if you need them: 100 points with one clue, down to 20 with all five.',
      'A wrong answer scores 0, and you cannot reveal more clues after answering.',
    ],
  },
}

// The games shown as cards (the daily challenge has its own banner)
export const hubGames = ['element_match', 'battle', 'molecule', 'mystery']

// Must match mysteryPoints() in server/src/services/games/scoring.js
export const mysteryWorth = (revealed) => Math.max(20, 120 - 20 * revealed)

export const percent = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0)