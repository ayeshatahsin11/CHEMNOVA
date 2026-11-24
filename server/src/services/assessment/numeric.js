import { evaluate } from 'mathjs'

// Plain "log" is refused on purpose: it is natural log in some tools and base 10 in others
const FUNCTIONS = /\b(log10|ln|sqrt|exp|abs)\b/g

// Computes the answer to a numerical question from the AI's expression.
// Only numbers, + - * / ^ ( ) and a few functions are allowed, anything else returns null.
export function safeEvaluate(expression) {
  if (typeof expression !== 'string') return null
  const expr = expression.trim()
  if (!expr || expr.length > 200) return null

  const stripped = expr.replace(FUNCTIONS, '')
  if (!/^[0-9eE+\-*/^().\s]+$/.test(stripped)) return null

  try {
    const value = evaluate(expr.replace(/\bln\b/g, 'log')) // mathjs: log = natural log
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

const SUPERSCRIPTS = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+',
}

// Reads a number from what a student typed: 1.2e-3, 1.2 x 10^-3, 1,000, 0,5, "0.25 mol/L" ...
export function parseNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null
  if (typeof input !== 'string') return null

  let s = input.trim().toLowerCase()
  if (!s) return null

  s = s
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUPERSCRIPTS[c])
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\s*[×x*·]\s*10\s*\^?\s*(?=[+-]?\d)/g, 'e')

  if (/^[+-]?\d{1,3}(,\d{3})+/.test(s)) s = s.replace(/,/g, '')
  else s = s.replace(/^([+-]?\d+),(\d+)/, '$1.$2')

  const m = s.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/)
  if (!m) return null

  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export function numericMatches(student, correct, tolerancePct) {
  if (correct === 0) return Math.abs(student) < 1e-9
  return Math.abs(student - correct) <= (Math.abs(correct) * tolerancePct) / 100
}

export function formatNumber(n) {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e5 || abs < 1e-3) return n.toExponential(3).replace(/\.?0+e/, 'e')
  return String(Number(n.toPrecision(4)))
}