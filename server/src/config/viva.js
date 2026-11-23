export const SUBJECTS = [
  'General Chemistry',
  'Organic Chemistry',
  'Inorganic Chemistry',
  'Physical Chemistry',
  'Analytical Chemistry',
  'Biochemistry',
  'Environmental Chemistry',
  'Spectroscopy',
]

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
export const INPUT_MODES = ['text', 'voice']

export const VIVA_LIMITS = {
  minQuestions: 3,
  maxQuestions: 15,
  defaultQuestions: 8,
  maxAnswerChars: 2000,
  maxTopicChars: 100,
}

export const VIVA_MODES = {
  university: {
    label: 'University Viva',
    description: 'A formal oral exam mixing definitions, explanations and applications.',
    guide:
      'Formal oral exam. Mix definitions, explanations and application questions. Keep a professional examiner tone.',
  },
  practical: {
    label: 'Practical Viva',
    description: 'Lab-focused: principles, observations, errors, calculations and safety.',
    guide:
      'Laboratory viva. Focus on the principles behind experiments, apparatus, observations, sources of error, calculations from results and safety awareness. Concepts only: never give step-by-step instructions for hazardous procedures.',
  },
  rapid_fire: {
    label: 'Rapid Fire',
    description: 'Short, quick questions that need one or two sentence answers.',
    guide:
      'Short, direct questions that need a one or two sentence answer. Keep every question under 25 words and move quickly across the topic.',
  },
  conceptual: {
    label: 'Conceptual Viva',
    description: 'Deep "why" and "how" questions that test real understanding.',
    guide:
      'Test deep understanding. Prefer why/how questions, predictions and comparisons over simple recall.',
  },
  research: {
    label: 'Advanced Research Viva',
    description: 'Open-ended questions on experimental design, data and limitations.',
    guide:
      'Advanced research viva. Ask open-ended questions about experimental design, interpreting data, limitations and how the student would investigate a problem. Expect reasoned argument, not a single right answer.',
  },
  surprise: {
    label: 'Surprise Examination',
    description: 'Unpredictable mix of question styles and subtopics.',
    guide:
      'Be unpredictable. Vary the question style (recall, calculation idea, application, "what would happen if") and jump between subtopics within the subject.',
  },
}

export const MODE_IDS = Object.keys(VIVA_MODES)

export const LEVEL_GUIDE = {
  School: 'secondary and higher-secondary curriculum; simple language and everyday examples',
  Undergraduate: 'bachelor-level university chemistry; standard textbook depth',
  Postgraduate: "master's level; mechanistic and quantitative depth, modern methods",
  Research: 'research level; experimental design, data interpretation and the limits of methods',
}

export const DIFFICULTY_GUIDE = {
  Beginner: 'recall and basic understanding',
  Intermediate: 'application and explanation',
  Advanced: 'analysis, multi-step reasoning and connecting concepts',
  Expert: 'synthesis, evaluation, unusual cases and edge conditions',
}