import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'

const BASE = `http://127.0.0.1:${env.port}/api`

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const check = (label, pass) => console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`)

await connectDB()

const email = 'smoke.auth@chemnova.dev'
const sneaky = 'admin.try@chemnova.dev'
await User.deleteMany({ email: { $in: [email, sneaky] } })

const person = { name: 'Smoke Auth', email, password: 'Test1234', level: 'School' }

let r = await call('POST', '/auth/register', person)
check('register returns 201, a token, and no password', r.status === 201 && !!r.data.token && !r.data.user?.password)
const token = r.data.token

r = await call('POST', '/auth/register', person)
check('duplicate email is rejected (409)', r.status === 409)

r = await call('POST', '/auth/register', { ...person, email: 'weak@chemnova.dev', password: 'short' })
check('weak password is rejected (400)', r.status === 400)

r = await call('POST', '/auth/register', { ...person, email: sneaky, role: 'admin' })
check('cannot sign up as admin (role forced to student)', r.status === 201 && r.data.user?.role === 'student')

r = await call('POST', '/auth/login', { email, password: 'WrongPass1' })
check('wrong password is rejected (401)', r.status === 401)

r = await call('POST', '/auth/login', { email, password: person.password })
check('correct login works (200)', r.status === 200 && !!r.data.token)

r = await call('GET', '/auth/me')
check('/me without a token is rejected (401)', r.status === 401)

r = await call('GET', '/auth/me', null, token)
check('/me with a token returns the user', r.status === 200 && r.data.user?.email === email)

r = await call('POST', '/auth/guest')
check('guest login works with role "guest"', r.status === 201 && r.data.user?.role === 'guest' && r.data.user?.isGuest === true)
const guestId = r.data.user?.id

await User.deleteMany({ email: { $in: [email, sneaky] } })
if (guestId) await User.deleteOne({ _id: guestId })
console.log('Test data cleaned up')

await mongoose.disconnect()