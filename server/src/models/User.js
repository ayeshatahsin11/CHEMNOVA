import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES, ROLE_LIST, LEVELS, GUEST_TTL_HOURS } from '../config/roles.js'

const notGuest = function () {
  return !this.isGuest
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name is too short'],
      maxlength: [60, 'Name is too long'],
    },
    email: {
      type: String,
      required: [notGuest, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 120,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    // select: false means the hash never leaves the database unless asked for explicitly
    password: {
      type: String,
      required: [notGuest, 'Password is required'],
      select: false,
    },
    role: { type: String, enum: ROLE_LIST, default: ROLES.STUDENT },
    level: { type: String, enum: LEVELS, default: 'Undergraduate' },
    subjects: { type: [String], default: [] },
    isGuest: { type: Boolean, default: false },
    // Only guests get this. MongoDB deletes the document when this date passes.
    expiresAt: { type: Date },
    lastLoginAt: { type: Date },
        showOnLeaderboard: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Email must be unique, but guests have no email, so only index documents that have one
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
)

// TTL index: guests are removed automatically (MongoDB checks about once a minute)
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

userSchema.pre('validate', function () {
  if (this.isGuest) {
    this.role = ROLES.GUEST
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + GUEST_TTL_HOURS * 60 * 60 * 1000)
    }
  }
})

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function (plain) {
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(plain, this.password)
}

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.password
    return ret
  },
})

export default mongoose.model('User', userSchema)