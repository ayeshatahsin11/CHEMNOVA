const SUP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻',
}
const SUB = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
  '+': '₊', '-': '₋',
}
const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε',
  lambda: 'λ', mu: 'μ', pi: 'π', sigma: 'σ', theta: 'θ', Omega: 'Ω',
}

// Turns every character into its Unicode form, or returns null if one has no form
const mapAll = (map, text) => {
  const chars = [...text.trim()]
  return chars.length && chars.every((c) => map[c]) ? chars.map((c) => map[c]).join('') : null
}

const wrap = (text) => (/^[\w.]+$/.test(text.trim()) ? text.trim() : `(${text.trim()})`)

// The AI is told to write plain Unicode, but sometimes writes LaTeX anyway. This turns it into readable text.
export function cleanMath(input) {
  let s = String(input ?? '')
    .replace(/\u2011/g, '-')
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/\\\[|\\\]|\\\(|\\\)/g, '')
    .replace(/\$\$?([^$\n]+)\$\$?/g, '$1')
    .replace(/\\(?:text|mathrm|mathbf|textbf|mathit)\{([^{}]*)\}/g, '$1')

  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}/${wrap(b)}`)
  }

  s = s
    .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => `√${wrap(a)}`)
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\rightleftharpoons\b/g, '⇌')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\(?:rightarrow|to)\b/g, '→')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\leq?\b/g, '≤')
    .replace(/\\geq?\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\pm\b/g, '±')
    .replace(/\\circ\b/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\\(alpha|beta|gamma|delta|Delta|epsilon|lambda|mu|pi|sigma|theta|Omega)\b/g, (_, name) => GREEK[name])
    .replace(/\\(?:left|right)\b/g, '')
    .replace(/\\(?:quad|qquad)\b/g, ' ')
    .replace(/\\[,;:!]/g, ' ')

  return s
    .replace(/\^\{([^{}]+)\}/g, (_, x) => mapAll(SUP, x) ?? `^(${x})`)
    .replace(/\^([+\-−]?\d+)/g, (_, x) => mapAll(SUP, x) ?? `^${x}`)
    .replace(/_\{([^{}]+)\}/g, (_, x) => mapAll(SUB, x) ?? `_(${x})`)
    .replace(/([A-Za-z)\]])_(\d+)/g, (_, a, x) => a + mapAll(SUB, x))
}