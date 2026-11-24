import mongoose from 'mongoose'
import { LEVELS } from '../config/roles.js'
import { SUBJECTS, DIFFICULTIES, VIVA_LIMITS } from '../config/viva.js'
import { TYPE_IDS } from '../config/assessment.js'

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: TYPE_IDS, required: true },
  prompt: { type: String, required: true, maxlength: 1500 },
  marks: { type: Number, required: true, min: 1 },
  topicTag: { type: String, default: 'General', maxlength: 80 },
  explanation: { type: String, default: '', maxlength: 2000 },

  // mcq
  options: { type: [String], default: undefined },
  correctIndex: { type: Number, min: 0, max: 3 },
  // true_false
  correctBool: { type: Boolean },
  // fill_blank
  acceptedAnswers: { type: [String], default: undefined },
  // numerical: "value" is computed by code from "expression"
  numeric: {
    expression: { type: String, maxlength: 200 },
    value: Number,
    unit: { type: String, maxlength: 20 },
    tolerancePct: Number,
  },
  // conceptual / descriptive
  modelAnswer: { type: String, maxlength: 2000 },
  keyPoints: { type: [String], default: undefined },
})

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 160 },
    subject: { type: String, enum: SUBJECTS, required: true },
    topic: { type: String, trim: true, maxlength: VIVA_LIMITS.maxTopicChars, default: '' },
    level: { type: String, enum: LEVELS, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    types: { type: [{ type: String, enum: TYPE_IDS }], required: true },
    requestedQuestions: { type: Number, required: true },
    questionCount: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number, default: 0, min: 0, max: 180 }, // 0 = untimed
    questions: [questionSchema],
    expiresAt: { type: Date }, // guests only
  },
  { timestamps: true },
)

assessmentSchema.index({ user: 1, createdAt: -1 })
assessmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// The default JSON never includes the questions, so answer keys cannot leak by accident
assessmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.questions
    delete ret.expiresAt
    return ret
  },
})

export default mongoose.model('Assessment', assessmentSchema)