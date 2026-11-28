import api, { getErrorMessage } from './client'

const browserTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function toError(err) {
  const first = err.response?.data?.details?.[0]?.message
  const error = new Error(first || getErrorMessage(err))
  error.status = err.response?.status
  error.data = err.response?.data // the daily challenge's 409 carries the id of today's round
  return error
}

async function request(fn) {
  try {
    return await fn()
  } catch (err) {
    throw toError(err)
  }
}

export const getOverview = () =>
  request(async () => (await api.get('/games/overview', { params: { tz: browserTz() } })).data)

export const startRound = (game) =>
  request(async () => (await api.post(`/games/${game}/rounds`, { tz: browserTz() })).data)

export const getRound = (id) => request(async () => (await api.get(`/games/rounds/${id}`)).data)

export const checkAnswer = (id, body) =>
  request(async () => (await api.post(`/games/rounds/${id}/check`, body)).data)

export const revealClue = (id, questionId) =>
  request(async () => (await api.post(`/games/rounds/${id}/reveal`, { questionId })).data)

export const submitRound = (id, answers) =>
  request(async () => (await api.post(`/games/rounds/${id}/submit`, { answers })).data)

export const getLeaderboard = (game, period) =>
  request(async () => (await api.get('/games/leaderboard', { params: { game, period } })).data)