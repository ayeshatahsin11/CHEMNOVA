import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, X, ArrowRight } from 'lucide-react'
import { navItems } from '../../lib/navigation'

export default function SidebarContent({ layoutKey, onNavigate, onClose }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between px-2 pt-1 pb-6">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
            <FlaskConical size={18} className="text-[#04121c]" />
          </span>
          <span className="text-lg">ChemNova</span>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:text-content"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <p className="px-3 pb-2 font-mono text-[11px] tracking-widest text-muted uppercase">Workspace</p>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onNavigate} className="group relative block rounded-xl">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`nav-active-${layoutKey}`}
                    className="absolute inset-0 rounded-xl border border-accent/30 bg-gradient-to-r from-cyan-400/20 to-violet-500/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-content' : 'text-muted group-hover:text-content'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-lg transition duration-300 group-hover:scale-110 ${
                      isActive
                        ? `bg-gradient-to-br ${item.gradient} text-[#04121c]`
                        : 'bg-surface-2/70 group-hover:bg-surface-2'
                    }`}
                  >
                    <item.icon size={17} />
                  </span>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* TEMPORARY: static guest card. Replaced by the real user once auth is built. */}
      <div className="mt-4 rounded-xl border border-border bg-surface-2/50 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-[#04121c]">
            G
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Guest Explorer</p>
            <p className="text-xs text-muted">Limited access</p>
          </div>
        </div>
        <Link
          to="/register"
          onClick={onNavigate}
          className="group mt-3 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/20"
        >
          Create a free account
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}