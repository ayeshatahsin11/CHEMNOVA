import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import FormField from '../components/auth/FormField'
import FormAlert from '../components/auth/FormAlert'
import PasswordStrength from '../components/auth/PasswordStrength'
import useAuth from '../hooks/useAuth'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirm,
} from '../lib/validators'

const levels = [
  { value: 'School', hint: 'Up to grade 12' },
  { value: 'Undergraduate', hint: "Bachelor's" },
  { value: 'Postgraduate', hint: "Master's / PhD" },
  { value: 'Research', hint: 'Professional' },
]

export default function Register() {
  const { user, register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    level: 'Undergraduate',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

   if (user && !user.isGuest) return <Navigate to="/dashboard" replace />
  const setField = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((er) => ({ ...er, [key]: '' }))
    setServerError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const next = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setLoading(true)
    setServerError('')
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        level: form.level,
      })
    } catch (err) {
      setServerError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning chemistry the smarter way. It is free."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <FormAlert message={serverError} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          id="name"
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={setField('name')}
          error={errors.name}
        />
        <FormField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={setField('email')}
          error={errors.email}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium" id="level-label">
            Academic level
          </p>
          <div role="radiogroup" aria-labelledby="level-label" className="grid grid-cols-2 gap-2">
            {levels.map((l) => {
              const active = form.level === l.value
              return (
                <button
                  key={l.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setForm((f) => ({ ...f, level: l.value }))}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-accent bg-accent/10 ring-4 ring-accent/10'
                      : 'border-border bg-surface-2/60 hover:border-accent/50'
                  }`}
                >
                  <span className="block text-sm font-medium">{l.value}</span>
                  <span className="block text-xs text-muted">{l.hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <FormField
            id="password"
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={setField('password')}
            error={errors.password}
          />
          <PasswordStrength value={form.password} />
        </div>

        <FormField
          id="confirm"
          label="Confirm password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={setField('confirm')}
          error={errors.confirm}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-glow w-full justify-center disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creating account...
            </>
          ) : (
            <>
              Create account <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        New accounts start as Student. Educator access is granted by an administrator.
      </p>
    </AuthShell>
  )
}