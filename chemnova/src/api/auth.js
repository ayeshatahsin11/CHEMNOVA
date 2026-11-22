/*
 * TEMPORARY STUB, no backend yet.
 * Accounts live in this browser's localStorage and passwords are NOT stored
 * or checked. In Phase 3 these three functions become real axios calls
 * (POST /auth/register, /auth/login, /auth/guest) and nothing else changes.
 */
const SESSION_KEY = 'chemnova-session'
const USERS_KEY = 'chemnova-stub-users'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) ?? []
  } catch {
    return []
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export async function registerRequest({ name, email, level }) {
  await wait(800)
  const users = readUsers()
  const normalized = email.toLowerCase()

  if (users.some((u) => u.email === normalized)) {
    throw new Error('An account with this email already exists')
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email: normalized,
    level,
    role: 'student',
    isGuest: false,
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  return saveSession(user)
}

export async function loginRequest({ email }) {
  await wait(700)
  const user = readUsers().find((u) => u.email === email.toLowerCase())
  if (!user) {
    throw new Error('No account found with this email. Try registering first.')
  }
  return saveSession(user)
}

export async function guestRequest() {
  await wait(500)
  return saveSession({
    id: 'guest',
    name: 'Guest Explorer',
    email: '',
    level: 'Undergraduate',
    role: 'guest',
    isGuest: true,
  })
}