export default function QuestionNav({ total, questions, activeId, disabled, onSelect }) {
  const byOrder = new Map(questions.map((q) => [q.order, q]))
  const hasSkipped = questions.some((q) => q.skipped && !q.answeredAt)

  const base =
    'grid h-9 min-w-9 place-items-center rounded-lg border px-2 font-mono text-xs font-semibold transition'
  const tones = {
    answered: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    skipped:
      'border-amber-400/40 bg-amber-400/10 text-amber-500 hover:-translate-y-0.5 hover:border-amber-400',
    open: 'border-accent/50 bg-accent/10 text-accent hover:-translate-y-0.5',
    upcoming: 'border-border bg-surface-2/40 text-muted/60',
  }
  const names = { answered: 'answered', skipped: 'skipped, open to answer', open: 'current', upcoming: 'not reached yet' }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 backdrop-blur-md">
      <ol className="flex flex-wrap gap-2" aria-label="Questions">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const q = byOrder.get(n)
          let state = 'upcoming'
          if (q) state = q.answeredAt ? 'answered' : q.skipped ? 'skipped' : 'open'

          const active = q && q.id === activeId
          const className = `${base} ${tones[state]} ${active ? 'border-accent ring-4 ring-accent/20' : ''}`
          const label = `Question ${n}: ${names[state]}`

          return (
            <li key={n}>
              {state === 'skipped' || state === 'open' ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(q.id)}
                  aria-label={label}
                  aria-current={active ? 'step' : undefined}
                  title={label}
                  className={`${className} disabled:pointer-events-none disabled:opacity-60`}
                >
                  {n}
                </button>
              ) : (
                <span className={className} title={label} aria-label={label}>
                  {n}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {hasSkipped && (
        <p className="mt-3 text-xs text-muted">
          Skipped questions (amber) stay open. Click one to answer it before you finish, or it counts as 0.
        </p>
      )}
    </div>
  )
}