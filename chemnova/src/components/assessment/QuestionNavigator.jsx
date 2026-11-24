import { isAnswered } from '../../lib/assessment'

export default function QuestionNavigator({ questions, answers, current, onSelect, disabled }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 backdrop-blur-md">
      <ol className="flex flex-wrap gap-2" aria-label="Questions">
        {questions.map((q, i) => {
          const done = isAnswered(answers[q.id])
          const active = i === current

          return (
            <li key={q.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(i)}
                aria-label={`Question ${i + 1}: ${done ? 'answered' : 'not answered'}`}
                aria-current={active ? 'step' : undefined}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 font-mono text-xs font-semibold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 ${
                  done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                    : 'border-border bg-surface-2/40 text-muted'
                } ${active ? 'border-accent ring-4 ring-accent/20' : ''}`}
              >
                {i + 1}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-xs text-muted">Green means answered. You can jump to any question.</p>
    </div>
  )
}