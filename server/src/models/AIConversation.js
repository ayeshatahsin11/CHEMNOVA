import mongoose from 'mongoose'
import { LEVELS } from '../config/roles.js'
import { COMPANION_MODE_IDS, COMPANION_LIMITS } from '../config/companion.js'

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 12000 },
    mode: { type: String, enum: COMPANION_MODE_IDS }, // the mode used for this exchange
    // Only on solver answers: did code check the arithmetic?
    verification: {
      status: { type: String, enum: ['verified', 'corrected', 'unverified', 'unchecked'] },
      checks: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, default: 'New conversation', maxlength: COMPANION_LIMITS.maxTitleChars },
    mode: { type: String, enum: COMPANION_MODE_IDS, default: 'standard' },
    level: { type: String, enum: LEVELS, default: 'Undergraduate' },
    messages: [messageSchema],
    messageCount: { type: Number, default: 0 },
    userMessageCount: { type: Number, default: 0 }, // used for the guest limit
    preview: { type: String, default: '', maxlength: 160 },
    lastMessageAt: { type: Date },
    expiresAt: { type: Date }, // guests only
  },
  { timestamps: true },
)

conversationSchema.index({ user: 1, lastMessageAt: -1 })
conversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// The default JSON leaves out the messages, so lists stay small. The controller adds them when needed.
conversationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.messages
    delete ret.expiresAt
    delete ret.userMessageCount
    return ret
  },
})

export default mongoose.model('AIConversation', conversationSchema)