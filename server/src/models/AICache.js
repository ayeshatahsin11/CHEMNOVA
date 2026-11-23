import mongoose from 'mongoose'

const aiCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// MongoDB deletes expired entries automatically
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('AICache', aiCacheSchema)