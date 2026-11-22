import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, Mic, ClipboardCheck, Gamepad2, Sun, Moon, ArrowLeft } from 'lucide-react'
import AmbientBackground from '../ui/AmbientBackground'
import HeroBackground, { scenes } from '../hero/HeroBackground'
import useTheme from '../../hooks/useTheme'
import useAuth from '../../hooks/useAuth'

const perks = [
  { icon: Mic, text: 'Viva sessions with an examiner that adapts to you' },
  { icon: ClipboardCheck, text: 'Timed tests with instant, explained grading' },
  { icon: Gamepad2, text: 'Games and daily challenges to keep revision fun' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
        <FlaskConical size={18} className="text-[#04121c]" />
      </span>
      <span className="text-lg">ChemNova</span>
    </Link>
  )
}

export default function AuthShell({ title, subtitle, children, footer }) {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const [scene, setScene] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setScene((s) => (s + 1) % scenes.length), 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative text-content">
      <AmbientBackground />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden border-r border-border lg:block">
          <HeroBackground index={scene} />
          <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
            <Logo />

            <div>
              <h2 className="text-4xl leading-tight font-bold tracking-tight">
                Your chemistry lab,
                <br />
                <span className="text-gradient">powered by AI.</span>
              </h2>
              <ul className="mt-8 space-y-4">
                {perks.map((p) => (
                  <li key={p.text} className="flex items-center gap-3 text-sm text-content/80">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface/60 text-accent backdrop-blur">
                      <p.icon size={17} />
                    </span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-mono text-xs text-muted">Beyond Learning. Into Discovery.</p>
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex items-center justify-center px-5 py-16 sm:px-10">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface/60 text-muted backdrop-blur transition hover:border-accent/50 hover:text-content"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            {user?.isGuest && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-4 py-2.5 text-xs text-muted backdrop-blur">
                <span>You are browsing as a guest.</span>
                <Link
                  to="/dashboard"
                  className="flex shrink-0 items-center gap-1 font-medium text-accent hover:underline"
                >
                  <ArrowLeft size={13} /> Back to app
                </Link>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-surface/70 p-7 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>

            <p className="mt-6 text-center text-sm text-muted">{footer}</p>
          </motion.div>
        </main>
      </div>
    </div>
  )
}