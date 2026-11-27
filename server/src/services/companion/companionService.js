import { z } from 'zod'
import { askAI, askAIJSON } from '../ai/aiService.js'
import { companionSystem } from './prompts.js'
import { applyChecks } from './calc.js'
import { cleanMath } from './cleanMath.js'

const solverSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.slice(0, 8000)),
  checks: z.array(z.unknown()).max(20).catch([]),
})

const clip = (text) => cleanMath(String(text ?? '').trim()).slice(0, 8000)

/**
 * Writes the Companion's answer.
 * history = earlier messages as [{ role, content }], userText = the new student message.
 * Returns { content, verification, provider }, where verification is null unless the solver was used.
 */
export async function generateReply({ mode, level, history, userText }) {
  if (mode === 'solver') {
    try {
      const out = await askAIJSON({
        system: companionSystem({ mode, level, checked: true }),
        messages: history,
        prompt: userText,
        schema: solverSchema,
        temperature: 0.3,
        maxTokens: 4500,
        timeoutMs: 45_000,
      })

      const applied = applyChecks(out.data.reply, out.data.checks)
      return {
        content: clip(applied.content),
        verification: applied.status === 'none' ? null : { status: applied.status, checks: applied.checks },
        provider: out.provider,
      }
    } catch (err) {
      console.warn('[companion] checked solver failed, answering without code checks:', err.message)
    }

    // The checked format failed, so answer normally and say plainly that nothing was checked
    const out = await askAI({
      system: companionSystem({ mode, level, checked: false }),
      messages: history,
      prompt: userText,
      temperature: 0.3,
      maxTokens: 3500,
      timeoutMs: 40_000,
    })
    return { content: clip(out.text), verification: { status: 'unchecked', checks: 0 }, provider: out.provider }
  }

  const out = await askAI({
    system: companionSystem({ mode, level }),
    messages: history,
    prompt: userText,
    temperature: 0.5,
    maxTokens: 3000,
    timeoutMs: 40_000,
  })
  return { content: clip(out.text), verification: null, provider: out.provider }
}