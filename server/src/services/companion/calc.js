import { z } from 'zod'
import { safeEvaluate, formatNumber } from '../assessment/numeric.js'

const checkSchema = z.object({
  id: z.string().trim().regex(/^c\d{1,2}$/),
  expression: z.string().trim().min(1).max(200),
  approx: z.number().optional().catch(undefined),
})

/**
 * Replaces {{c1}}, {{c2}} ... in the AI's solution with numbers computed by code.
 * An expression may use earlier results (c1, c2 ...). Nothing the AI claims is trusted: only code values are shown.
 *
 * status: 'verified'   every number was computed by code and matched the AI's own estimate
 *         'corrected'  code computed a different value from the AI's estimate, and the code value is shown
 *         'unverified' something could not be computed, so part of the arithmetic is unchecked
 *         'none'       the answer needed no calculation
 */
export function applyChecks(reply, rawChecks) {
  const values = new Map()
  let computed = 0
  let corrected = false
  let failed = false

  for (const raw of Array.isArray(rawChecks) ? rawChecks : []) {
    const parsed = checkSchema.safeParse(raw)
    if (!parsed.success) {
      failed = true
      continue
    }

    const { id, expression, approx } = parsed.data

    // Earlier results are filled in as numbers. An id that has no value yet is left in, and the evaluator refuses it.
    const filled = expression.replace(/\bc\d{1,2}\b/g, (name) =>
      values.has(name) ? `(${values.get(name)})` : name,
    )
    const value = safeEvaluate(filled)

    if (value === null) {
      failed = true
      continue
    }

    values.set(id, value)
    computed++
    if (typeof approx === 'number' && Math.abs(value - approx) > Math.max(Math.abs(value) * 0.02, 1e-9)) {
      corrected = true
    }
  }

  let unresolved = false
  const content = String(reply ?? '').replace(/\{\{\s*(c\d{1,2})\s*\}\}/g, (_, id) => {
    if (values.has(id)) return formatNumber(values.get(id))
    unresolved = true
    return '(?)'
  })

  const status =
    failed || unresolved ? 'unverified' : computed === 0 ? 'none' : corrected ? 'corrected' : 'verified'

  return { content, status, checks: computed }
}