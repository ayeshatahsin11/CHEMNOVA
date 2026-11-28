import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import AIConversation from '../models/AIConversation.js'
import { applyChecks } from '../services/companion/calc.js'
import { waitForServer } from './waitForServer.js'
const BASE = `http://127.0.0.1:${env.port}/api`

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(150_000),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const check = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`)
const show = (s) => (s ?? '').toString().replace(/\s+/g, ' ').slice(0, 110)

// ---------- Part 1: the calculation checker (no AI, no server) ----------
console.log('Part 1: calculation checks\n')

let a = applyChecks('Moles: {{c1}} mol. Concentration: {{c2}} M.', [
  { id: 'c1', expression: '29.2/58.44', approx: 0.4997 },
  { id: 'c2', expression: 'c1/0.5', approx: 0.9993 },
])
check(
  'placeholders become numbers computed by code, and later checks can use earlier ones',
  a.content === 'Moles: 0.4997 mol. Concentration: 0.9993 M.' && a.status === 'verified' && a.checks === 2,
  `-> ${a.content}`,
)

a = applyChecks('{{c1}}', [{ id: 'c1', expression: '29.2/58.44', approx: 0.9 }])
check('the code value is shown, and a wrong AI estimate is flagged as corrected', a.content === '0.4997' && a.status === 'corrected')

a = applyChecks('pH = {{c1}}', [{ id: 'c1', expression: '-log10(0.001)', approx: 3 }])
check('log10 works', a.content === 'pH = 3' && a.status === 'verified')

a = applyChecks('Value {{c9}}', [])
check('a placeholder with no check shows (?) and is unverified', a.content === 'Value (?)' && a.status === 'unverified')

a = applyChecks('{{c1}}', [{ id: 'c1', expression: 'process.exit(1)', approx: 1 }])
check('unsafe expressions are refused', a.content === '(?)' && a.status === 'unverified')

a = applyChecks('{{c1}}', [{ id: 'c1', expression: 'c2*2', approx: 1 }])
check('a check cannot use a result that does not exist yet', a.content === '(?)' && a.status === 'unverified')

a = applyChecks('Just an explanation.', [])
check('an answer with no calculations has status none', a.content === 'Just an explanation.' && a.status === 'none')

// ---------- Part 2: the API ----------
console.log('\nPart 2: the API (this makes 2 real AI calls and can take a minute or two)\n')

await connectDB()
await waitForServer()
const emails = ['smoke.companion.a@chemnova.dev', 'smoke.companion.b@chemnova.dev']
let guestId = null

async function cleanup() {
  const users = await User.find({ email: { $in: emails } }).select('_id')
  const ids = [...users.map((u) => u._id), ...(guestId ? [guestId] : [])]
  await AIConversation.deleteMany({ user: { $in: ids } })
  await User.deleteMany({ _id: { $in: ids } })
}
await cleanup()

const pw = 'Test1234'
let r = await call('POST', '/auth/register', { name: 'Companion A', email: emails[0], password: pw, level: 'Undergraduate' })
const tokenA = r.data.token
r = await call('POST', '/auth/register', { name: 'Companion B', email: emails[1], password: pw, level: 'Undergraduate' })
const tokenB = r.data.token

r = await call('GET', '/companion/options', null, tokenA)
check('options list 7 modes and starter questions', r.status === 200 && r.data.options?.modes?.length === 7 && r.data.options?.starters?.length > 0)

r = await call('POST', '/companion/conversations', {})
check('starting a conversation needs a login (401)', r.status === 401)

r = await call('POST', '/companion/conversations', { mode: 'wizard' }, tokenA)
check('an unknown mode is rejected (400)', r.status === 400)

r = await call('POST', '/companion/conversations', {}, tokenA)
check('conversation created with your level and the standard mode', r.status === 201 && r.data.conversation?.mode === 'standard' && r.data.conversation?.level === 'Undergraduate')
const id = r.data.conversation?.id

r = await call('POST', `/companion/conversations/${id}/messages`, { content: '   ' }, tokenA)
check('an empty message is rejected (400)', r.status === 400)
r = await call('POST', `/companion/conversations/${id}/messages`, { content: 'x'.repeat(2500) }, tokenA)
check('a message over 2000 characters is rejected (400)', r.status === 400)

r = await call('POST', `/companion/conversations/${id}/messages`, { content: 'Why is ice less dense than liquid water?' }, tokenA)
check(
  'a standard question gets an answer, and the first message names the conversation',
  r.status === 201 &&
    r.data.assistantMessage?.content?.length > 50 &&
    r.data.assistantMessage?.verification === null &&
    r.data.conversation?.title === 'Why is ice less dense than liquid water?',
)
console.log(`      reply: ${show(r.data.assistantMessage?.content)}`)

r = await call(
  'POST',
  `/companion/conversations/${id}/messages`,
  { content: 'How many moles are in 29.2 g of NaCl? Use a molar mass of 58.44 g/mol.', mode: 'solver' },
  tokenA,
)
const solved = r.data.assistantMessage
check(
  'the solver answers with the right number and no leftover placeholders',
  r.status === 201 && !!solved?.content && !solved.content.includes('{{') && /0\.4\d|0\.5/.test(solved.content),
)
check(
  'the solver says how its numbers were checked',
  ['verified', 'corrected', 'unverified', 'unchecked'].includes(solved?.verification?.status),
  `(status: ${solved?.verification?.status}, ${solved?.verification?.checks} checks)`,
)
console.log(`      reply: ${show(solved?.content)}`)

r = await call('GET', `/companion/conversations/${id}`, null, tokenA)
const roles = (r.data.messages ?? []).map((m) => m.role).join(',')
check('history is saved in order, and each answer remembers its mode', roles === 'user,assistant,user,assistant' && r.data.messages?.[3]?.mode === 'solver' && r.data.conversation?.mode === 'solver')

r = await call('GET', `/companion/conversations/${id}`, null, tokenB)
check("another user cannot open this conversation (404)", r.status === 404)
r = await call('POST', `/companion/conversations/${id}/messages`, { content: 'hello' }, tokenB)
check("another user cannot write in it (404)", r.status === 404)

r = await call('PATCH', `/companion/conversations/${id}`, { title: '  Moles   and ice  ' }, tokenA)
check('renaming works and tidies spaces', r.status === 200 && r.data.conversation?.title === 'Moles and ice')
r = await call('PATCH', `/companion/conversations/${id}`, {}, tokenA)
check('an empty update is rejected (400)', r.status === 400)

r = await call('GET', '/companion/conversations', null, tokenA)
check('the history lists the conversation with a preview', r.status === 200 && r.data.conversations?.length === 1 && r.data.conversations[0].messageCount === 4 && r.data.conversations[0].preview.length > 0)

// A full conversation is refused before any AI call
r = await call('POST', '/companion/conversations', {}, tokenA)
const fullId = r.data.conversation?.id
await AIConversation.updateOne({ _id: fullId }, { messageCount: 80 })
r = await call('POST', `/companion/conversations/${fullId}/messages`, { content: 'one more' }, tokenA)
check('a full conversation is refused (409)', r.status === 409)

r = await call('DELETE', `/companion/conversations/${id}`, null, tokenA)
check('conversation deleted', r.status === 200)
r = await call('GET', `/companion/conversations/${id}`, null, tokenA)
check('and it is gone (404)', r.status === 404)

// Guest limits (no AI calls)
r = await call('POST', '/auth/guest')
const tokenG = r.data.token
guestId = r.data.user?.id

const guestIds = []
for (let i = 0; i < 3; i++) {
  r = await call('POST', '/companion/conversations', {}, tokenG)
  guestIds.push(r.data.conversation?.id)
}
check('a guest can start 3 conversations', guestIds.every(Boolean))
r = await call('POST', '/companion/conversations', {}, tokenG)
check('but not a 4th (403)', r.status === 403)

await AIConversation.updateOne({ _id: guestIds[0] }, { userMessageCount: 5 })
r = await call('POST', `/companion/conversations/${guestIds[0]}/messages`, { content: 'hello' }, tokenG)
check('a guest who used 5 messages is stopped (403)', r.status === 403)

r = await call('GET', '/companion/conversations', null, tokenG)
check('guest history is empty (nothing is saved)', r.status === 200 && r.data.conversations?.length === 0)

await cleanup()
console.log('\nTest data cleaned up')
await mongoose.disconnect()