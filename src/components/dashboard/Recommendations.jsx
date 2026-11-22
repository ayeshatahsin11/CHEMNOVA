import { Link } from 'react-router-dom'
import { Sparkles, Mic, ClipboardCheck, Bot, Gamepad2, FlaskConical, ArrowRight } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import PanelHeader from './PanelHeader'

const icons = {
  viva: Mic,
  assessment: ClipboardCheck,
  companion: Bot,
  game: Gamepad2,
  research: FlaskConical,
}

export default function Recommendations({ items, personalised }) {
  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader
        icon={Sparkles}
        title="Recommended next"
        subtitle={personalised ? 'Picked from your results' : 'Good places to start'}
      />

      <ul className="mt-5 space-y-3">
        {items.map((r) => {
          const Icon = icons[r.icon] ?? Sparkles
          return (
            <li key={r.id}>
              <Link
                to={r.to}
                className="group/rec flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-3 transition hover:border-accent/50 hover:bg-surface-2"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-accent">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.title}</span>
                  <span className="block text-xs text-muted">{r.reason}</span>
                </span>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-muted transition-transform duration-300 group-hover/rec:translate-x-1 group-hover/rec:text-accent"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </SpotlightCard>
  )
}