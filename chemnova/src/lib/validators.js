const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(value) {
  const v = value.trim()
  if (!v) return 'Please enter your name'
  if (v.length < 2) return 'Name is too short'
  if (v.length > 60) return 'Name is too long'
  return ''
}

export function validateEmail(value) {
  const v = value.trim()
  if (!v) return 'Please enter your email'
  if (!emailRegex.test(v)) return 'Enter a valid email address'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'Please enter a password'
  if (value.length < 8) return 'Use at least 8 characters'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Include at least one letter and one number'
  }
  return ''
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password'
  if (password !== confirm) return 'Passwords do not match'
  return ''
}

// 0 (empty/weak) to 4 (strong)
export function passwordStrength(value) {
  let score = 0
  if (value.length >= 8) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score++
  return score
}