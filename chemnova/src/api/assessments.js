import api, { getErrorMessage } from './client'

// Generating and grading use the AI, which can be slow on free tiers
const AI_TIMEOUT = 150_000

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

export const getAssessmentOptions = () =>
  request(async () => (await api.get('/assessments/options')).data.options)

export const listAssessments = () =>
  request(async () => (await api.get('/assessments')).data.assessments)

export const createAssessment = (config) =>
  request(async () => (await api.post('/assessments', config, { timeout: AI_TIMEOUT })).data)

export const getAssessment = (id) => request(async () => (await api.get(`/assessments/${id}`)).data)

export const deleteAssessment = (id) =>
  request(async () => {
    await api.delete(`/assessments/${id}`)
  })

export const startAttempt = (assessmentId) =>
  request(async () => (await api.post(`/assessments/${assessmentId}/attempts`)).data)

export const getAttempt = (id) => request(async () => (await api.get(`/attempts/${id}`)).data)

export const saveAnswers = (id, answers) =>
  request(async () => (await api.patch(`/attempts/${id}/answers`, { answers })).data)

export const submitAttempt = (id, answers) =>
  request(async () => (await api.post(`/attempts/${id}/submit`, { answers }, { timeout: AI_TIMEOUT })).data)

export const regradeAttempt = (id) =>
  request(async () => (await api.post(`/attempts/${id}/grade`, null, { timeout: AI_TIMEOUT })).data)