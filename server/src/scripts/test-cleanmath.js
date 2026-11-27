import { cleanMath } from '../services/companion/cleanMath.js'

const check = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`)

const a = cleanMath('\\[ n = \\frac{m}{M} \\]').trim()
check('display math and fractions become plain text', a === 'n = m/M', `-> ${a}`)

const b = cleanMath('$H_2O$ and Fe^{3+} and 10^{-3} mol L^{-1}')
check('sub and superscripts become Unicode', b === 'H₂O and Fe³⁺ and 10⁻³ mol L⁻¹', `-> ${b}`)

const c = cleanMath('\\text{mol} \\times 10^3 \\rightarrow')
check('text, symbols and arrows', c === 'mol × 10³ →', `-> ${c}`)

const d = cleanMath('\\frac{a+b}{2}')
check('only complex fractions get brackets', d === '(a+b)/2', `-> ${d}`)

check('invisible hyphens are replaced', cleanMath('hydrogen\u2011bonded') === 'hydrogen-bonded')
check('normal text is left alone', cleanMath('H₂O → CO₂ costs $5') === 'H₂O → CO₂ costs $5')