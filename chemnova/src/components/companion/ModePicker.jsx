import { Sparkles } from 'lucide-react'
import { modeIcons } from '../../lib/companion'

export default function ModePicker({ modes, value, onChange, disabled }) {
  const current = modes.find((m) => m.id === value)

  return (
    <div>
      <div role="radiogroup" aria-label="Explanation mode" className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const Icon = modeIcons[m.id] ?? Sparkles
          const active = m.id === value

          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(m.id)}
              title={m.description}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60 ${
                active
                  ? 'border-accent bg-accent/15 font-medium text-content'
                  : 'border-border bg-surface-2/50 text-muted hover:border-accent/50 hover:text-content'
              }`}
            >
              <Icon size={13} /> {m.label}
            </button>
          )
        })}
      </div>
      {current && <p className="mt-2 text-xs text-muted">{current.description}</p>}
    </div>
  )
}