import { Link } from 'react-router-dom'
import { FlaskConical, Sun, Moon } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import useAuth from '../../hooks/useAuth'

export default function LandingNavbar() {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const realUser = user && !user.isGuest

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4">
      <nav className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl border border-border bg-surface/60 px-5 py-3 text-content shadow-lg shadow-black/5 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
            <FlaskConical size={18} className="text-[#04121c]" />
          </span>
          ChemNova
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <a href="#features" className="hidden text-sm text-muted transition hover:text-content sm:block">
            Features
          </a>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:bg-surface-2 hover:text-content"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {realUser ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-400 px-4 py-2 text-sm font-semibold text-[#04121c] transition hover:opacity-90"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              {user?.isGuest && (
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-border px-3 py-2 text-sm text-content transition hover:border-accent/50"
                >
                  Back to app
                </Link>
              )}
              <Link to="/login" className="hidden text-sm text-muted transition hover:text-content sm:block">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-400 px-4 py-2 text-sm font-semibold text-[#04121c] transition hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}