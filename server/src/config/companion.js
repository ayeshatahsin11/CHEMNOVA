export const COMPANION_MODES = {
  standard: {
    label: 'Standard',
    description: 'Clear answers matched to your academic level.',
    guide:
      'Answer clearly at the studentʼs academic level, in short paragraphs. Use a small worked example when it helps.',
  },
  eli15: {
    label: 'Explain like I am 15',
    description: 'Simple words and everyday comparisons, no heavy maths.',
    guide:
      'Explain as if to a curious 15-year-old: simple words, everyday comparisons, minimal maths, and define any technical term you must use. Simplify honestly. Never say something that is false just because it is simpler.',
  },
  university: {
    label: 'University level',
    description: 'Proper terminology, mechanisms and equations.',
    guide:
      'Give a university-level explanation: correct terminology, mechanisms and equations, key definitions, and links to related concepts, at typical textbook depth.',
  },
  research: {
    label: 'Research level',
    description: 'Technical depth, assumptions, limits and open questions.',
    guide:
      'Give a research-level answer: precise and technical, state the assumptions and limits of the models used, mention competing explanations and the usual experimental or computational approaches. Be explicit about uncertainty. Never invent studies, authors or numbers.',
  },
  solver: {
    label: 'Step-by-step solver',
    description: 'Worked numerical problems, with the arithmetic checked by code.',
    guide:
      'Solve numerical problems step by step: list the given data with units, state the formula, show each step with units, give the final answer with sensible significant figures, and finish with a one-line sanity check.',
  },
  analogy: {
    label: 'Real-life analogy',
    description: 'An everyday analogy first, then the real chemistry.',
    guide:
      'Explain through a real-life analogy first. Then map the analogy to the real chemistry piece by piece, and finish by saying where the analogy breaks down.',
  },
  exam: {
    label: 'Exam preparation',
    description: 'Key points, a model answer, common mistakes and a practice question.',
    guide:
      'Help the student prepare for an exam: list the key points a marking scheme would reward, give a short model answer, warn about common mistakes, and end with one practice question (give its answer only if asked).',
  },
}

export const COMPANION_MODE_IDS = Object.keys(COMPANION_MODES)

export const COMPANION_LIMITS = {
  maxMessageChars: 2000,
  maxMessages: 80, // per conversation, counting both sides
  historyWindow: 12, // how many recent messages the AI sees
  maxTitleChars: 80,
}

// Example questions for the empty chat screen
export const STARTERS = [
  { text: 'Why does ice float on water?', mode: 'eli15' },
  { text: 'Why does an SN2 reaction invert the configuration?', mode: 'university' },
  { text: 'How many grams of NaCl do I need to make 500 mL of a 0.20 M solution?', mode: 'solver' },
  { text: 'Name this compound: CH₃CH(OH)CH₂CH₃', mode: 'standard' },
  { text: 'What does a strong peak near 1700 cm⁻¹ in an IR spectrum tell me?', mode: 'university' },
  { text: 'Explain Le Chatelier’s principle with an everyday analogy', mode: 'analogy' },
]