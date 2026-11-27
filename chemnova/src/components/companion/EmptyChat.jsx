import { Sparkles } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import { modeIcons } from '../../lib/companion'

export default function EmptyChat({ starters, modeLabels, onPick, disabled }) {
  return (
    <div className="px-2 py-6 text-center sm:py-10">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500">
        <Sparkles size={30} className="text-[#04121c]" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">
        Ask me anything about <span className="text-gradient">chemistry</span>
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Pick a mode above, then ask a question or try one of these.
      </p>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
        {starters.map((s) => {
          const Icon = modeIcons[s.mode] ?? Sparkles
          return (
            <button
              key={s.text}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="block h-full w-full text-left disabled:opacity-60"
            >
              <SpotlightCard className="h-full p-4">
                <p className="text-sm leading-relaxed">{s.text}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-xs text-accent">
                  <Icon size={12} /> {modeLabels[s.mode]}
                </span>
              </SpotlightCard>
            </button>
          )
        })}
      </div>
    </div>
  )
}