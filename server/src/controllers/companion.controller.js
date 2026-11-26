import AIConversation from '../models/AIConversation.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { LEVELS, GUEST_LIMITS } from '../config/roles.js'
import { COMPANION_MODES, COMPANION_LIMITS as L, STARTERS } from '../config/companion.js'
import { generateReply } from '../services/companion/companionService.js'

const expiryFor = (user) => (user.isGuest && user.expiresAt ? { expiresAt: user.expiresAt } : {})

const messageDto = (m) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  mode: m.mode ?? null,
  verification: m.verification?.status
    ? { status: m.verification.status, checks: m.verification.checks ?? 0 }
    : null,
  createdAt: m.createdAt,
})

const titleFrom = (text) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 60 ? `${t.slice(0, 57).trimEnd()}...` : t
}

const previewFrom = (text) =>
  text
    .replace(/[#*_`>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)

// What the AI sees: the most recent messages, starting with a student message
function historyFor(conversation) {
  const recent = conversation.messages.slice(-L.historyWindow).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 3000),
  }))
  while (recent.length && recent[0].role !== 'user') recent.shift()
  return recent
}

async function guestInfo(user) {
  if (!user.isGuest) return null

  const [row] = await AIConversation.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: null, total: { $sum: '$userMessageCount' } } },
  ])
  return { remaining: Math.max(0, GUEST_LIMITS.companionMessagesPerDay - (row?.total ?? 0)) }
}

async function findOwned(req) {
  const found = await AIConversation.findOne({ _id: req.params.id, user: req.user._id })
  if (!found) throw new ApiError(404, 'Conversation not found')
  return found
}

// GET /api/companion/options
export const getOptions = (req, res) => {
  const guest = req.user.isGuest

  res.json({
    success: true,
    options: {
      modes: Object.entries(COMPANION_MODES).map(([id, m]) => ({
        id,
        label: m.label,
        description: m.description,
      })),
      levels: LEVELS,
      starters: STARTERS,
      limits: { maxMessageChars: L.maxMessageChars, maxMessages: L.maxMessages },
      guest: guest
        ? {
            messagesPerDay: GUEST_LIMITS.companionMessagesPerDay,
            conversations: GUEST_LIMITS.companionConversations,
          }
        : null,
    },
  })
}

// GET /api/companion/conversations (guests are not saved, so they get an empty list)
export const listConversations = asyncHandler(async (req, res) => {
  if (req.user.isGuest) return res.json({ success: true, conversations: [] })

  const conversations = await AIConversation.find({ user: req.user._id, messageCount: { $gt: 0 } })
    .select('-messages')
    .sort({ lastMessageAt: -1 })
    .limit(50)

  res.json({ success: true, conversations })
})

// POST /api/companion/conversations: start an empty conversation (no AI call)
export const createConversation = asyncHandler(async (req, res) => {
  const { mode, level } = req.validated.body

  if (req.user.isGuest) {
    const used = await AIConversation.countDocuments({ user: req.user._id })
    if (used >= GUEST_LIMITS.companionConversations) {
      throw new ApiError(
        403,
        `Guests can start ${GUEST_LIMITS.companionConversations} conversations. Create a free account to continue.`,
      )
    }
  }

  const conversation = await AIConversation.create({
    user: req.user._id,
    mode: mode ?? 'standard',
    level: level ?? req.user.level,
    lastMessageAt: new Date(),
    ...expiryFor(req.user),
  })

  res.status(201).json({ success: true, conversation, messages: [], guest: await guestInfo(req.user) })
})

// GET /api/companion/conversations/:id
export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await findOwned(req)

  res.json({
    success: true,
    conversation,
    messages: conversation.messages.map(messageDto),
    guest: await guestInfo(req.user),
  })
})

// PATCH /api/companion/conversations/:id
export const updateConversation = asyncHandler(async (req, res) => {
  const { title, mode, level } = req.validated.body

  const updated = await AIConversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { ...(title !== undefined && { title }), ...(mode && { mode }), ...(level && { level }) } },
    { new: true },
  )
  if (!updated) throw new ApiError(404, 'Conversation not found')

  res.json({ success: true, conversation: updated })
})

// DELETE /api/companion/conversations/:id
export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await findOwned(req)
  await conversation.deleteOne()
  res.json({ success: true })
})

// POST /api/companion/conversations/:id/messages: ask a question and get the answer
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, mode } = req.validated.body
  const conversation = await findOwned(req)

  if (conversation.messageCount >= L.maxMessages) {
    throw new ApiError(409, 'This conversation is full. Start a new one to keep going.')
  }

  if (req.user.isGuest) {
    const { remaining } = await guestInfo(req.user)
    if (remaining <= 0) {
      throw new ApiError(
        403,
        `Guests can send ${GUEST_LIMITS.companionMessagesPerDay} messages. Create a free account to keep chatting.`,
      )
    }
  }

  const chosenMode = mode ?? conversation.mode

  // If the AI fails this throws, and nothing has been saved, so the student can simply send again
  const reply = await generateReply({
    mode: chosenMode,
    level: conversation.level,
    history: historyFor(conversation),
    userText: content,
  })

  const now = new Date()
  const first = conversation.messageCount === 0

  // The messageCount filter means two messages sent at the same moment cannot interleave
  const updated = await AIConversation.findOneAndUpdate(
    { _id: conversation._id, messageCount: conversation.messageCount },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content, mode: chosenMode, createdAt: now },
            {
              role: 'assistant',
              content: reply.content,
              mode: chosenMode,
              ...(reply.verification && { verification: reply.verification }),
              createdAt: new Date(),
            },
          ],
        },
      },
      $inc: { messageCount: 2, userMessageCount: 1 },
      $set: {
        mode: chosenMode,
        lastMessageAt: now,
        preview: previewFrom(reply.content),
        ...(first && { title: titleFrom(content) }),
      },
    },
    { new: true },
  )

  if (!updated) throw new ApiError(409, 'Another message was sent at the same time. Please try again.')

  const [userMessage, assistantMessage] = updated.messages.slice(-2)

  res.status(201).json({
    success: true,
    userMessage: messageDto(userMessage),
    assistantMessage: messageDto(assistantMessage),
    conversation: updated,
    guest: await guestInfo(req.user),
  })
})