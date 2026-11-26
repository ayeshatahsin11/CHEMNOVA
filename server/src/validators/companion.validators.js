import { z } from 'zod'
import { LEVELS } from '../config/roles.js'
import { COMPANION_MODE_IDS, COMPANION_LIMITS as L } from '../config/companion.js'

// Removes invisible control characters but keeps new lines and tabs
const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

const mode = z.enum(COMPANION_MODE_IDS, 'Choose one of the listed modes')
const level = z.enum(LEVELS, 'Choose an academic level')

export const createConversationSchema = z.object({
  mode: mode.optional(),
  level: level.optional(),
})

export const sendMessageSchema = z.object({
  content: z
    .string()
    .max(L.maxMessageChars, `Keep your message under ${L.maxMessageChars} characters`)
    .transform((s) => clean(s).trim())
    .refine((s) => s.length > 0, { message: 'Write a message first' }),
  mode: mode.optional(),
})

export const updateConversationSchema = z
  .object({
    title: z
      .string()
      .max(L.maxTitleChars, `Keep the title under ${L.maxTitleChars} characters`)
      .transform((s) => clean(s).replace(/\s+/g, ' ').trim())
      .refine((s) => s.length > 0, { message: 'Give the conversation a title' })
      .optional(),
    mode: mode.optional(),
    level: level.optional(),
  })
  .refine((d) => d.title !== undefined || d.mode !== undefined || d.level !== undefined, {
    message: 'Nothing to update',
  })