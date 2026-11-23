import mongoose from 'mongoose'
import { LEVELS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES, MODE_IDS, INPUT_MODES, VIVA_LIMITS } from '../config/viva.js'

const vivaSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: SUBJECTS, required: true },
    topic: { type: String, trim: true, maxlength: VIVA_LIMITS.maxTopicChars, default: '' },
    level: { type: String, enum: LEVELS, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    mode: { type: String, enum: MODE_IDS, required: true },
    inputMode: { type: String, enum: INPUT_MODES, default: 'text' },
    totalQuestions: {
      type: Number,
      required: true,
      min: VIVA_LIMITS.minQuestions,
      max: VIVA_LIMITS.maxQuestions,
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    score: { type: Number, min: 0, max: 100 }, // overall %, set when the exam is finished
    report: { type: mongoose.Schema.Types.Mixed },
    completedAt: { type: Date },
    expiresAt: { type: Date }, // guests only: MongoDB deletes the session when this passes
  },
  { timestamps: true },
)

vivaSessionSchema.index({ user: 1, createdAt: -1 })
vivaSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

vivaSessionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.expiresAt
    return ret
  },
})

export default mongoose.model('VivaSession', vivaSessionSchema)