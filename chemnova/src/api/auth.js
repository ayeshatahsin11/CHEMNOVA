import api, { TOKEN_KEY, getErrorMessage } from './client'

const USER_KEY = 'chemnova-session'

function toError(err) {
  // Prefer the first specific validation message if the server sent any
  const first = err.response?.data?.details?.[0]?.message
  return new Error(first || getErrorMessage(err))
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  return saveUser(user)
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)

// A saved user only counts if a token exists too (this also drops leftovers from the old stub)
export function getStoredUser() {
  if (!getToken()) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('chemnova-stub-users')
}

async function authPost(path, body) {
  try {
    const { data } = await api.post(path, body)
    return saveSession(data)
  } catch (err) {
    throw toError(err)
  }
}

export const registerRequest = ({ name, email, password, level }) =>
  authPost('/auth/register', { name, email, password, level })

export const loginRequest = ({ email, password }) =>
  authPost('/auth/login', { email, password })

export const guestRequest = () => authPost('/auth/guest')

export async function meRequest() {
  try {
    const { data } = await api.get('/auth/me')
    return saveUser(data.user)
  } catch (err) {
    throw toError(err)
  }
}