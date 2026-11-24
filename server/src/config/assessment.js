export const QUESTION_TYPES = {
  mcq: { label: 'Multiple choice', marks: 1, minutes: 1 },
  true_false: { label: 'True / False', marks: 1, minutes: 0.5 },
  fill_blank: { label: 'Fill in the blank', marks: 1, minutes: 1 },
  numerical: { label: 'Numerical problem', marks: 2, minutes: 3 },
  conceptual: { label: 'Conceptual question', marks: 3, minutes: 3 },
  descriptive: { label: 'Descriptive question', marks: 5, minutes: 6 },
}

export const TYPE_IDS = Object.keys(QUESTION_TYPES)

// These two are graded by the AI, everything else is graded by code
export const AI_GRADED = new Set(['conceptual', 'descriptive'])

export const ASSESSMENT_LIMITS = {
  minQuestions: 3,
  maxQuestions: 20,
  defaultQuestions: 10,
  minDuration: 5,
  maxDuration: 180,
  maxAnswerChars: 3000,
  maxTopicChars: 100,
  gracePeriodSec: 30,
}