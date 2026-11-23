import mongoose from 'mongoose'

const mark = { type: Number, min: 0, max: 10 }

const vivaQuestionSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'VivaSession', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, required: true, min: 1 },
    question: { type: String, required: true, maxlength: 600 },
    topicTag: { type: String, default: 'General', maxlength: 80 },
    isFollowUp: { type: Boolean, default: false },

    answer: { type: String, maxlength: 2100 },
    skipped: { type: Boolean, default: false },
    scores: { accuracy: mark, understanding: mark, explanation: mark, reasoning: mark },
    overall: { type: Number, min: 0, max: 100 },
    feedback: { type: String, maxlength: 1000 },
    misconception: { type: String, maxlength: 400 },
    answeredAt: { type: Date },

    expiresAt: { type: Date },
  },
  { timestamps: true },
)

// Also guarantees a session can never get two questions with the same number
vivaQuestionSchema.index({ session: 1, order: 1 }, { unique: true })
vivaQuestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

vivaQuestionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.expiresAt
    return ret
  },
})

export default mongoose.model('VivaQuestion', vivaQuestionSchema)