import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import FormField from '../components/auth/FormField'
import FormAlert from '../components/auth/FormAlert'
import useAuth from '../hooks/useAuth'
import { validateEmail } from '../lib/validators'

export default function Login() {
  const { user, login, guestLogin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(null) // null | 'login' | 'guest'

  // Only real accounts are redirected. Guests may still log in or register.
  if (user && !user.isGuest) return <Navigate to={from} replace />

  const setField = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((er) => ({ ...er, [key]: '' }))
    setServerError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const next = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'Please enter your password',
    }
    setErrors(next)
    if (next.email || next.password) return

    setBusy('login')
    setServerError('')
    try {
      await login({ email: form.email.trim(), password: form.password })
    } catch (err) {
      setServerError(err.message)
      setBusy(null)
    }
  }

  const onGuest = async () => {
    setBusy('guest')
    setServerError('')
    try {
      await guestLogin()
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err.message)
      setBusy(null)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your chemistry journey."
      footer={
        <>
          New to ChemNova?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <FormAlert message={serverError} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
        <FormField
          id="password"
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={setField('password')}
          error={errors.password}
        />

        <button
          type="submit"
          disabled={busy !== null}
          className="btn-glow w-full justify-center disabled:pointer-events-none disabled:opacity-60"
        >
          {busy === 'login' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Logging in...
            </>
          ) : (
            <>
              Log in <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onGuest}
        disabled={busy !== null}
        className="btn-outline w-full justify-center disabled:pointer-events-none disabled:opacity-60"
      >
        {busy === 'guest' ? (
          <>
            <Loader2 size={17} className="animate-spin" /> Entering...
          </>
        ) : (
          <>
            <Sparkles size={17} /> {user?.isGuest ? 'Continue your guest session' : 'Continue as guest'}
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Guests get limited access and nothing is saved.
      </p>
    </AuthShell>
  )
}