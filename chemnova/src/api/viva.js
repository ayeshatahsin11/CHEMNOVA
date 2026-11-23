import api, { getErrorMessage } from './client'

// The AI can be slow on free tiers (the server may try two providers), so these calls get a long timeout
const AI_TIMEOUT = 100_000

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

export const getVivaOptions = () =>
  request(async () => (await api.get('/viva/options')).data.options)

export const listVivaSessions = () =>
  request(async () => (await api.get('/viva/sessions')).data.sessions)

export const createVivaSession = (config) =>
  request(async () => (await api.post('/viva/sessions', config, { timeout: AI_TIMEOUT })).data)

export const getVivaSession = (id) =>
  request(async () => (await api.get(`/viva/sessions/${id}`)).data)

export const answerVivaQuestion = (id, body) =>
  request(async () => (await api.post(`/viva/sessions/${id}/answer`, body, { timeout: AI_TIMEOUT })).data)

export const finishVivaSession = (id) =>
  request(async () => (await api.post(`/viva/sessions/${id}/finish`, null, { timeout: AI_TIMEOUT })).data.session)

export const deleteVivaSession = (id) =>
  request(async () => {
    await api.delete(`/viva/sessions/${id}`)
  })