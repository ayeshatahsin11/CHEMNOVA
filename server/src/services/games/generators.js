import { ELEMENTS, CATEGORIES, ELECTRONEGATIVITY } from '../../data/elements.js'
import { MOLECULES, FAMILIES, CONFUSABLE, GEOMETRIES } from '../../data/molecules.js'
import { MYSTERY } from '../../data/mystery.js'
import { GAMES } from '../../config/games.js'
import { pick, sample, shuffle } from './rng.js'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const withAka = (x) => (x.aka ? `${x.name} (${x.aka})` : x.name)

// Builds a multiple-choice question with shuffled options. Returns null if there are too few wrong answers.
function mc(rng, { prompt, correct, wrong, explanation, tag, choices = 4 }) {
  const right = String(correct)
  const others = [...new Set(wrong.map(String))].filter((w) => w !== right)
  if (others.length < choices - 1) return null

  const options = shuffle(rng, [right, ...others.slice(0, choices - 1)])
  return { kind: 'mc', prompt, options, correctIndex: options.indexOf(right), explanation, tag }
}

// Calls random builders until there are `count` different questions
function collect(rng, builders, count) {
  const out = []
  const seen = new Set()
  let guard = 0

  while (out.length < count && guard++ < count * 80) {
    const q = pick(rng, builders)(rng)
    if (!q || seen.has(q.prompt)) continue
    seen.add(q.prompt)
    out.push(q)
  }
  return out
}

// ---------- Elements ----------
const withGroup = ELEMENTS.filter((e) => e.group)
const withCategory = ELEMENTS.filter((e) => e.category)
const bySymbol = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, e]))
const others = (rng, e, n = 3) =>
  sample(rng, ELEMENTS.filter((x) => x !== e), n)

function explainElement(e) {
  const place = [e.group && `group ${e.group}`, e.period && `period ${e.period}`].filter(Boolean)
  return (
    `${e.name} (${e.symbol}) is element ${e.number}${place.length ? `, in ${place.join(', ')}` : ''}.` +
    (e.origin ? ` The symbol ${e.symbol} comes from ${e.origin}.` : '')
  )
}

const qSymbolToName = (rng) => {
  const e = pick(rng, ELEMENTS)
  return mc(rng, {
    prompt: `Which element has the symbol ${e.symbol}?`,
    correct: e.name,
    wrong: others(rng, e).map((x) => x.name),
    explanation: explainElement(e),
    tag: 'Elements',
  })
}

const qNameToSymbol = (rng) => {
  const e = pick(rng, ELEMENTS)
  return mc(rng, {
    prompt: `What is the symbol for ${e.name}?`,
    correct: e.symbol,
    wrong: others(rng, e).map((x) => x.symbol),
    explanation: explainElement(e),
    tag: 'Elements',
  })
}

const qNumberToName = (rng) => {
  const e = pick(rng, ELEMENTS)
  return mc(rng, {
    prompt: `Which element has atomic number ${e.number}?`,
    correct: e.name,
    wrong: others(rng, e).map((x) => x.name),
    explanation: explainElement(e),
    tag: 'Atomic number',
  })
}

const qNameToNumber = (rng) => {
  const e = pick(rng, ELEMENTS)
  return mc(rng, {
    prompt: `What is the atomic number of ${e.name}?`,
    correct: e.number,
    wrong: others(rng, e).map((x) => x.number),
    explanation: explainElement(e),
    tag: 'Atomic number',
  })
}

const qGroup = (rng) => {
  const e = pick(rng, withGroup)
  return mc(rng, {
    prompt: `In which group of the periodic table is ${e.name}?`,
    correct: `Group ${e.group}`,
    wrong: sample(rng, range(1, 18).filter((g) => g !== e.group), 3).map((g) => `Group ${g}`),
    explanation: explainElement(e),
    tag: 'Groups',
  })
}

const qPeriod = (rng) => {
  const e = pick(rng, ELEMENTS)
  return mc(rng, {
    prompt: `In which period is ${e.name}?`,
    correct: `Period ${e.period}`,
    wrong: sample(rng, range(1, 7).filter((p) => p !== e.period), 3).map((p) => `Period ${p}`),
    explanation: explainElement(e),
    tag: 'Periods',
  })
}

const qCategory = (rng) => {
  const key = pick(rng, Object.keys(CATEGORIES))
  const e = pick(rng, withCategory.filter((x) => x.category === key))
  return mc(rng, {
    prompt: `Which of these is ${CATEGORIES[key]}?`,
    correct: e.name,
    wrong: sample(rng, withCategory.filter((x) => x.category !== key), 3).map((x) => x.name),
    explanation: `${e.name} is ${CATEGORIES[key]} (group ${e.group}).`,
    tag: 'Families',
  })
}

export const ELEMENT_BUILDERS = [qSymbolToName, qNameToSymbol, qNumberToName, qNameToNumber, qGroup, qPeriod, qCategory]

// ---------- Trends (two options) ----------
const MAIN_GROUPS = [1, 2, 13, 14, 15, 16, 17]
const inGroup = (g) => ELEMENTS.filter((e) => e.group === g && e.symbol !== 'H')
const orderedNames = (a, b) => [a.name, b.name].sort((x, y) => x.localeCompare(y))

function qElectronegativity(rng) {
  const [a, b] = sample(rng, Object.keys(ELECTRONEGATIVITY), 2).map((s) => bySymbol[s])
  const ea = ELECTRONEGATIVITY[a.symbol]
  const eb = ELECTRONEGATIVITY[b.symbol]
  if (Math.abs(ea - eb) < 0.3) return null // close values make poor questions

  const [hi, lo] = ea > eb ? [a, b] : [b, a]
  const [n1, n2] = orderedNames(a, b)
  return mc(rng, {
    prompt: `Which is more electronegative: ${n1} or ${n2}?`,
    correct: hi.name,
    wrong: [lo.name],
    choices: 2,
    explanation: `Pauling electronegativity: ${hi.name} ${ELECTRONEGATIVITY[hi.symbol].toFixed(2)}, ${lo.name} ${ELECTRONEGATIVITY[lo.symbol].toFixed(2)}. It generally rises across a period and falls down a group.`,
    tag: 'Trends',
  })
}

function qRadius(rng) {
  let big
  let small
  let explanation

  if (rng() < 0.5) {
    const [a, b] = sample(rng, inGroup(pick(rng, MAIN_GROUPS)), 2)
    ;[big, small] = a.period > b.period ? [a, b] : [b, a]
    explanation = `Atomic radius increases down a group: ${big.name} has more electron shells than ${small.name}.`
  } else {
    const period = pick(rng, [2, 3, 4, 5, 6])
    const row = ELEMENTS.filter((e) => e.period === period && MAIN_GROUPS.includes(e.group))
    if (row.length < 2) return null
    const [a, b] = sample(rng, row, 2)
    if (Math.abs(a.group - b.group) < 2) return null // keep the comparison clear-cut
    ;[big, small] = a.group < b.group ? [a, b] : [b, a]
    explanation = `Across a period atomic radius decreases as the nuclear charge grows: ${big.name} (group ${big.group}) is larger than ${small.name} (group ${small.group}).`
  }

  const [n1, n2] = orderedNames(big, small)
  return mc(rng, {
    prompt: `Which has the larger atomic radius: ${n1} or ${n2}?`,
    correct: big.name,
    wrong: [small.name],
    choices: 2,
    explanation,
    tag: 'Trends',
  })
}

function qIonisation(rng) {
  // Only groups where the trend down the group has no exceptions
  const [a, b] = sample(rng, inGroup(pick(rng, [1, 2, 16, 17, 18])), 2)
  const [high, low] = a.period < b.period ? [a, b] : [b, a]
  const [n1, n2] = orderedNames(a, b)

  return mc(rng, {
    prompt: `Which has the higher first ionisation energy: ${n1} or ${n2}?`,
    correct: high.name,
    wrong: [low.name],
    choices: 2,
    explanation: `First ionisation energy decreases down a group: the outer electron of ${low.name} is further from the nucleus and more shielded than in ${high.name}.`,
    tag: 'Trends',
  })
}

const TREND_BUILDERS = [qElectronegativity, qRadius, qIonisation]

// ---------- Molecules ----------
const withGeometry = MOLECULES.filter((m) => m.geometry)
const withPolarity = MOLECULES.filter((m) => typeof m.polar === 'boolean')
const withFamily = MOLECULES.filter((m) => m.group)
const familyKeys = Object.keys(FAMILIES)
const clashes = (key) => [key, ...(CONFUSABLE[key] ?? [])]

const qFormulaToName = (rng) => {
  const m = pick(rng, MOLECULES)
  return mc(rng, {
    prompt: `Which compound has the formula ${m.formula}?`,
    correct: withAka(m),
    wrong: sample(rng, MOLECULES.filter((x) => x !== m), 3).map(withAka),
    explanation: `${withAka(m)} has the formula ${m.formula}.`,
    tag: 'Formulas',
  })
}

const qNameToFormula = (rng) => {
  const m = pick(rng, MOLECULES)
  return mc(rng, {
    prompt: `What is the formula of ${withAka(m)}?`,
    correct: m.formula,
    wrong: sample(rng, MOLECULES.filter((x) => x !== m), 3).map((x) => x.formula),
    explanation: `${withAka(m)} has the formula ${m.formula}.`,
    tag: 'Formulas',
  })
}

const familyExplanation = (m) =>
  `${withAka(m)} contains ${FAMILIES[m.group].has}, so it is ${FAMILIES[m.group].phrase}.`

const qFamilyOfCompound = (rng) => {
  const m = pick(rng, withFamily)
  const banned = clashes(m.group)
  return mc(rng, {
    prompt: `Which family of compounds does ${withAka(m)} (${m.formula}) belong to?`,
    correct: cap(m.group),
    wrong: sample(rng, familyKeys.filter((k) => !banned.includes(k)), 3).map(cap),
    explanation: familyExplanation(m),
    tag: 'Functional groups',
  })
}

const qCompoundOfFamily = (rng) => {
  const key = pick(rng, [...new Set(withFamily.map((m) => m.group))])
  const m = pick(rng, withFamily.filter((x) => x.group === key))
  const banned = clashes(key)
  return mc(rng, {
    prompt: `Which of these compounds is ${FAMILIES[key].phrase}?`,
    correct: withAka(m),
    wrong: sample(rng, withFamily.filter((x) => !banned.includes(x.group)), 3).map(withAka),
    explanation: familyExplanation(m),
    tag: 'Functional groups',
  })
}

const qShape = (rng) => {
  const m = pick(rng, withGeometry)
  return mc(rng, {
    prompt: `What is the molecular shape of ${withAka(m)} (${m.formula})?`,
    correct: cap(m.geometry),
    wrong: sample(rng, GEOMETRIES.filter((g) => g !== m.geometry), 3).map(cap),
    explanation: m.shapeWhy,
    tag: 'Shapes',
  })
}

const qPolarity = (rng) => {
  const m = pick(rng, withPolarity)
  return {
    kind: 'mc',
    prompt: `Is ${withAka(m)} (${m.formula}) polar or nonpolar?`,
    options: ['Polar', 'Nonpolar'],
    correctIndex: m.polar ? 0 : 1,
    explanation: m.polarWhy,
    tag: 'Polarity',
  }
}

// Listed more than once so they come up more often
export const MOLECULE_BUILDERS = [
  qFormulaToName, qFormulaToName,
  qNameToFormula, qNameToFormula,
  qFamilyOfCompound,
  qCompoundOfFamily, qCompoundOfFamily,
  qShape, qShape,
  qPolarity,
]

// ---------- Mystery compound ----------
function buildMystery(rng, count) {
  return sample(rng, MYSTERY, count).map((c) => {
    const options = shuffle(rng, [c, ...sample(rng, MYSTERY.filter((x) => x !== c), 3)]).map(withAka)
    return {
      kind: 'mystery',
      prompt: 'Which compound am I?',
      options,
      correctIndex: options.indexOf(withAka(c)),
      explanation: `${withAka(c)}, ${c.formula}.`,
      tag: 'Mystery',
      clues: c.clues,
      revealed: 1,
    }
  })
}

// ---------- One entry point ----------
export function generateQuestions(game, rng) {
  const count = GAMES[game].questions

  switch (game) {
    case 'element_match':
      return collect(rng, ELEMENT_BUILDERS, count)
    case 'battle':
      return shuffle(rng, [
        ...collect(rng, [qElectronegativity], 10),
        ...collect(rng, [qRadius], 10),
        ...collect(rng, [qIonisation], 10),
      ])
    case 'molecule':
      return collect(rng, MOLECULE_BUILDERS, count)
    case 'mystery':
      return buildMystery(rng, count)
    case 'daily':
      return [
        ...collect(rng, ELEMENT_BUILDERS, 2),
        ...collect(rng, TREND_BUILDERS, 1),
        ...collect(rng, MOLECULE_BUILDERS, 2),
      ]
    default:
      return []
  }
}