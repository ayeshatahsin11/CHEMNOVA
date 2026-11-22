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
}