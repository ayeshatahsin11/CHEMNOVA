export const getRecognition = () =>
  typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null

export const canRecognize = () => Boolean(getRecognition())

export const canSpeak = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance !== 'undefined'

export const accents = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-IN', label: 'English (India)' },
]

const PREFS_KEY = 'chemnova-voice'

export function loadVoicePrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY))
    return {
      lang: accents.some((a) => a.value === saved?.lang) ? saved.lang : 'en-US',
      autoRead: saved?.autoRead !== false,
    }
  } catch {
    return { lang: 'en-US', autoRead: true }
  }
}

export function saveVoicePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // storage is unavailable, the preference just will not be remembered
  }
}

// Makes text easier for a speech engine to read: subscripts become digits, arrows become words
export function toSpeakable(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/→|⟶|->/g, ' yields ')
    .replace(/⇌|⇄|<->/g, ' is in equilibrium with ')
    .replace(/°C/g, ' degrees Celsius')
    .replace(/°/g, ' degrees ')
    .replace(/≈/g, ' approximately ')
    .replace(/\bSN\s?([12])\b/g, 'S N $1')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLong(sentence, max) {
  const out = []
  let rest = sentence.trim()

  while (rest.length > max) {
    let cut = rest.lastIndexOf(', ', max)
    if (cut < max / 2) cut = rest.lastIndexOf(' ', max)
    if (cut <= 0) cut = max
    out.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1).trim()
  }

  if (rest) out.push(rest)
  return out
}

// Browsers cut off long utterances, so speech is read in short pieces (a decimal point never splits a number)
export function chunkText(text, max = 180) {
  const source = String(text ?? '')
  const pieces = (source.match(/(?:[^.!?]|\.(?=\d))+[.!?]*\s*/g) ?? [source]).flatMap((s) => splitLong(s, max))

  const chunks = []
  let current = ''
  for (const piece of pieces) {
    if (current && `${current} ${piece}`.length > max) {
      chunks.push(current)
      current = piece
    } else {
      current = current ? `${current} ${piece}` : piece
    }
  }
  if (current) chunks.push(current)

  return chunks.filter(Boolean)
}

// Speech recognition writes chemistry terms the way they sound, so fix the common ones
const FIXES = [
  [/\bp\s?h\b/gi, 'pH'],
  [/\bs\s?n\s?(?:1|one)\b/gi, 'SN1'],
  [/\bs\s?n\s?(?:2|two)\b/gi, 'SN2'],
  [/\bh\s?(?:2|two)\s?o\b/gi, 'H2O'],
  [/\bc\s?o\s?(?:2|two)\b/gi, 'CO2'],
  [/\bh\s?(?:2|two)\s?s\s?o\s?(?:4|four)\b/gi, 'H2SO4'],
  [/\bn\s?a\s?c\s?l\b/gi, 'NaCl'],
  [/\bn\s?a\s?o\s?h\b/gi, 'NaOH'],
  [/\bh\s?c\s?l\b/gi, 'HCl'],
  [/\bn\s?m\s?r\b/gi, 'NMR'],
]

export function fixTranscript(text) {
  return FIXES.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), String(text ?? ''))
}