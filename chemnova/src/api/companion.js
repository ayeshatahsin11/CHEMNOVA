import api, { getErrorMessage } from './client'

// The AI can be slow on free tiers (the server may try two providers)
const AI_TIMEOUT = 120_000

function toError(err) {
  const first = err.response?.data?.details?.[0]?.message
  const error = new Error(first || getErrorMessage(err))
  error.status = err.response?.status
  return error
}

async function request(fn) {
  try {
    return await fn()
  } catch (err) {
    throw toError(err)
  }
}

export const getCompanionOptions = () =>
  request(async () => (await api.get('/companion/options')).data.options)

export const listConversations = () =>
  request(async () => (await api.get('/companion/conversations')).data.conversations)

export const createConversation = (body) =>
  request(async () => (await api.post('/companion/conversations', body)).data)

export const getConversation = (id) =>
  request(async () => (await api.get(`/companion/conversations/${id}`)).data)

export const updateConversation = (id, body) =>
  request(async () => (await api.patch(`/companion/conversations/${id}`, body)).data.conversation)

export const deleteConversation = (id) =>
  request(async () => {
    await api.delete(`/companion/conversations/${id}`)
  })

export const sendMessage = (id, body) =>
  request(async () => (await api.post(`/companion/conversations/${id}/messages`, body, { timeout: AI_TIMEOUT })).data)