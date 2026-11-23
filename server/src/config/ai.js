import { env } from './env.js'

// Both Gemini and Groq expose an OpenAI-compatible API, so one client handles all of them
export const AI_PROVIDERS = {
  gemini: {
    name: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: env.ai.geminiKey,
    model: env.ai.geminiModel,
  },
  groq: {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: env.ai.groqKey,
    model: env.ai.groqModel,
  },
  openrouter: {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: env.ai.openrouterKey,
    model: env.ai.openrouterModel, // optional: stays off until you set a model in .env
  },
}

export const AI_ORDER = env.ai.order