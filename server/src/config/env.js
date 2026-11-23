import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET']
const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Check server/.env`)
  process.exit(1)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  ai: {
    geminiKey: process.env.GEMINI_API_KEY || '',
    groqKey: process.env.GROQ_API_KEY || '',
    openrouterKey: process.env.OPENROUTER_API_KEY || '',
    // Model names change often. Override in server/.env if one stops working.
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    openrouterModel: process.env.OPENROUTER_MODEL || '',
    order: (process.env.AI_PROVIDER_ORDER || 'gemini,groq,openrouter')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
}