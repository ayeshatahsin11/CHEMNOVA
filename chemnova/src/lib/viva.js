import { GraduationCap, FlaskConical, Zap, Lightbulb, Microscope, Shuffle } from 'lucide-react'

// Must match VIVA_LIMITS.maxAnswerChars in server/src/config/viva.js
export const MAX_ANSWER_CHARS = 2000

// Display names, mirroring server/src/config/viva.js
export const modeLabels = {
  university: 'University Viva',
  practical: 'Practical Viva',
  rapid_fire: 'Rapid Fire',
  conceptual: 'Conceptual Viva',
  research: 'Advanced Research Viva',
  surprise: 'Surprise Examination',
}

export const modeIcons = {
  university: GraduationCap,
  practical: FlaskConical,
  rapid_fire: Zap,
  conceptual: Lightbulb,
  research: Microscope,
  surprise: Shuffle,
}

export const panelClass = 'rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md'

export function scoreClass(score) {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-500'
  if (score >= 50) return 'bg-amber-400/15 text-amber-500'
  return 'bg-red-500/15 text-red-500'
}

export function formatDuration(totalSec = 0) {
  const sec = Math.max(0, Math.round(totalSec))
  const m = Math.floor(sec / 60)
  return m ? `${m}m ${sec % 60}s` : `${sec}s`
}