import { z } from 'zod'
import { LEVELS } from '../config/roles.js'

const name = z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long')

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, 'Email is too long')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

// bcrypt only uses the first 72 bytes, so we cap the length there
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')

// Note: there is deliberately no "role" field. Unknown fields are stripped.
export const registerSchema = z.object({
  name,
  email,
  password,
  level: z.enum(LEVELS).default('Undergraduate'),
})

// Login only checks that something was typed, it never reveals the password rules
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Please enter your password'),
})