import { Link, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import { navItems } from '../../lib/navigation'

export default function Topbar({ onMenu }) {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const current = navItems.find((i) => pathname.startsWith(i.to))

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/60 px-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface/60 text-muted transition hover:text-content lg:hidden"
        >
          <Menu size={19} />
        </button>
        <div>
          <h1 className="text-lg leading-tight font-semibold">{current?.title ?? 'ChemNova'}</h1>
          {current && <p className="hidden text-xs text-muted sm:block">{current.subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface/60 text-muted transition hover:border-accent/50 hover:text-content"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* TEMPORARY: static guest chip. Replaced by the real user once auth is built. */}
        <Link
          to="/settings"
          className="flex items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pr-3 pl-1 transition hover:border-accent/50"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-[#04121c]">
            G
          </span>
          <span className="hidden text-sm sm:block">Guest</span>
        </Link>
      </div>
    </header>
  )
}