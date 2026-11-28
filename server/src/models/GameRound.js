import mongoose from 'mongoose'
import { GAME_IDS } from '../config/games.js'

const { ObjectId } = mongoose.Schema.Types

const questionSchema = new mongoose.Schema({
  kind: { type: String, enum: ['mc', 'mystery'], required: true },
  prompt: { type: String, required: true, maxlength: 300 },
  options: { type: [String], required: true },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '', maxlength: 600 },
  tag: { type: String, default: '', maxlength: 40 },
  clues: { type: [String], default: undefined }, // mystery only
  revealed: { type: Number, min: 1 }, // mystery only: how many clues have been shown
})

const resultSchema = new mongoose.Schema(
  {
    questionId: { type: ObjectId, required: true },
    choice: { type: Number, default: null },
    correct: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    revealed: Number,
  },
  { _id: false },
)

const roundSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    game: { type: String, enum: GAME_IDS, required: true },
    status: { type: String, enum: ['active', 'finished'], default: 'active' },
    guest: { type: Boolean, default: false },
    dayKey: { type: String }, // daily challenge only, like 2026-11-27
    startedAt: { type: Date, required: true },
    durationSec: { type: Number, default: 0 }, // 0 = untimed
    questions: { type: [questionSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    finishedAt: Date,
    durationMs: Number,
    late: { type: Boolean, default: false }, // a timed round whose answers arrived too late to count
    score: Number,
    maxScore: Number,
    correct: Number,
    answered: Number,
    personalBest: { type: Boolean, default: false },
    previousBest: Number,
    expiresAt: Date, // unfinished rounds and guest rounds are cleaned up automatically
  },
  { timestamps: true },
)

roundSchema.index({ user: 1, game: 1, status: 1, score: -1 })
roundSchema.index({ game: 1, status: 1, guest: 1, score: -1 })
// One daily challenge per person per day, even if two requests arrive together
roundSchema.index(
  { user: 1, dayKey: 1 },
  { unique: true, partialFilterExpression: { game: 'daily', dayKey: { $type: 'string' } } },
)
roundSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// The default JSON never includes the questions, so the answer key cannot leak by accident
roundSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.questions
    delete ret.expiresAt
    return ret
  },
})

export default mongoose.model('GameRound', roundSchema)