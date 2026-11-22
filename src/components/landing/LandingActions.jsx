import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

// Buttons shown to signed-in users, by role
const roleActions = {
  student: { primary: 'Continue learning', secondary: { label: 'Start a viva', to: '/viva' } },
  educator: { primary: 'Open dashboard', secondary: { label: 'Create an assessment', to: '/assessments' } },
  admin: { primary: 'Open dashboard', secondary: { label: 'Review settings', to: '/settings' } },
}

export default function LandingActions({ variant = 'hero' }) {
  const { user, guestLogin } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // hero sits on a coloured scene, the bottom banner sits on the page surface
  const secondaryClass = variant === 'hero' ? 'btn-ghost' : 'btn-outline'

  const enterAsGuest = async () => {
    setBusy(true)
    setError('')
    try {
      await guestLogin()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  // Signed-in account (student / educator / admin)
  if (user && !user.isGuest) {
    const actions = roleActions[user.role] ?? roleActions.student
    return (
      <>
        <Link to="/dashboard" className="btn-glow">
          {actions.primary} <ArrowRight size={18} />
        </Link>
        <Link to={actions.secondary.to} className={secondaryClass}>
          {actions.secondary.label}
        </Link>
      </>
    )
  }

  // Guest session
  if (user?.isGuest) {
    return (
      <>
        <Link to="/register" className="btn-glow">
          Create free account <ArrowRight size={18} />
        </Link>
        <Link to="/dashboard" className={secondaryClass}>
          Continue exploring
        </Link>
      </>
    )
  }

  // Not logged in
  return (
    <>
      <Link to="/register" className="btn-glow">
        {variant === 'hero' ? 'Get started free' : 'Create free account'} <ArrowRight size={18} />
      </Link>
      <button
        type="button"
        onClick={enterAsGuest}
        disabled={busy}
        className={`${secondaryClass} disabled:pointer-events-none disabled:opacity-60`}
      >
        {busy ? (
          <>
            <Loader2 size={17} className="animate-spin" /> Entering...
          </>
        ) : (
          <>
            <Sparkles size={17} /> {variant === 'hero' ? 'Explore as guest' : 'Continue as guest'}
          </>
        )}
      </button>
      {error && <p className="w-full text-sm text-red-500">{error}</p>}
    </>
  )
}