import mongoose from 'mongoose'

const { ObjectId, Mixed } = mongoose.Schema.Types

const answerSchema = new mongoose.Schema(
  { questionId: { type: ObjectId, required: true }, response: Mixed },
  { _id: false },
)

const resultSchema = new mongoose.Schema(
  {
    questionId: { type: ObjectId, required: true },
    gradedBy: { type: String, enum: ['auto', 'ai'], default: 'auto' },
    pending: { type: Boolean, default: false }, // waiting for AI grading
    answered: { type: Boolean, default: true },
    correct: { type: Boolean, default: false }, // true only for full marks
    earned: { type: Number, default: 0 },
    max: { type: Number, required: true },
    feedback: { type: String, default: '', maxlength: 800 },
    covered: { type: [Number], default: [] }, // key points the answer covered
  },
  { _id: false },
)

const attemptSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    assessment: { type: ObjectId, ref: 'Assessment', required: true },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    startedAt: { type: Date, required: true },
    deadline: { type: Date }, // only for timed assessments
    answers: { type: [answerSchema], default: [] },
    submittedAt: { type: Date },
    timeTakenSec: { type: Number },
    timedOut: { type: Boolean, default: false },
    gradingStatus: { type: String, enum: ['none', 'pending', 'complete'], default: 'none' },
    results: { type: [resultSchema], default: [] },
    score: { type: Number, min: 0, max: 100 },
    earnedMarks: { type: Number },
    totalMarks: { type: Number },
    report: { type: Mixed },
    expiresAt: { type: Date }, // guests only
  },
  { timestamps: true },
)

attemptSchema.index({ user: 1, createdAt: -1 })
attemptSchema.index({ assessment: 1, createdAt: -1 })
// One unfinished attempt per person per assessment, even if the start button is pressed twice
attemptSchema.index(
  { assessment: 1, user: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } },
)
attemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

attemptSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.expiresAt
    return ret
  },
})

export default mongoose.model('AssessmentAttempt', attemptSchema)