import { typeMeta, AI_GRADED_TYPES, MAX_ANSWER_CHARS } from '../../lib/assessment'
import { panelClass } from '../../lib/viva'

const letters = ['A', 'B', 'C', 'D']
const chip = 'rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-xs'
const inputClass =
  'w-full rounded-xl border border-border bg-surface-2/60 p-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60'

function Prompt({ question }) {
  if (question.type !== 'fill_blank') {
    return <p className="mt-4 text-lg leading-relaxed font-medium">{question.prompt}</p>
  }

  const parts = question.prompt.split(/_{3,}/)
  return (
    <p className="mt-4 text-lg leading-relaxed font-medium">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <>
              <span aria-hidden className="mx-1 inline-block w-20 border-b-2 border-accent align-baseline" />
              <span className="sr-only"> blank </span>
            </>
          )}
        </span>
      ))}
    </p>
  )
}

function Choice({ active, disabled, onClick, badge, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition duration-300 disabled:opacity-60 ${
        active
          ? 'border-accent bg-accent/10 ring-4 ring-accent/10'
          : 'border-border bg-surface-2/50 hover:-translate-y-0.5 hover:border-accent/50'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
          active ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-[#04121c]' : 'bg-surface-2 text-muted'
        }`}
      >
        {badge}
      </span>
      <span className="min-w-0 leading-relaxed">{children}</span>
    </button>
  )
}

export default function QuestionCard({ question, index, total, value, onChange, disabled }) {
  const meta = typeMeta[question.type]
  const text = typeof value === 'string' ? value : ''
  const nearLimit = text.length > MAX_ANSWER_CHARS * 0.9

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-muted">
          Question {index + 1} of {total}
        </span>
        <span className={`${chip} flex items-center gap-1 text-accent`}>
          <meta.icon size={12} /> {meta.label}
        </span>
        <span className={chip}>
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </span>
        <span className={chip}>{question.topicTag}</span>
        {AI_GRADED_TYPES.includes(question.type) && (
          <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-secondary">Graded by AI</span>
        )}
      </div>

      <Prompt question={question} />

      <div className="mt-6">
        {question.type === 'mcq' && (
          <div role="radiogroup" aria-label="Answer options" className="space-y-3">
            {question.options.map((option, i) => (
              <Choice
                key={i}
                badge={letters[i]}
                active={value === i}
                disabled={disabled}
                onClick={() => onChange(value === i ? null : i)}
              >
                {option}
              </Choice>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div role="radiogroup" aria-label="True or false" className="grid gap-3 sm:grid-cols-2">
            <Choice badge="T" active={value === true} disabled={disabled} onClick={() => onChange(value === true ? null : true)}>
              True
            </Choice>
            <Choice badge="F" active={value === false} disabled={disabled} onClick={() => onChange(value === false ? null : false)}>
              False
            </Choice>
          </div>
        )}

        {question.type === 'fill_blank' && (
          <input
            autoFocus
            type="text"
            aria-label="Your answer"
            maxLength={120}
            disabled={disabled}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type the missing word or value"
            className={inputClass}
          />
        )}

        {question.type === 'numerical' && (
          <div>
            <div className="flex items-center gap-3">
              <input
                autoFocus
                type="text"
                inputMode="decimal"
                aria-label="Your answer"
                maxLength={40}
                disabled={disabled}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter a number"
                className={`${inputClass} max-w-xs font-mono`}
              />
              {question.unit && (
                <span className="rounded-lg border border-border bg-surface-2/70 px-3 py-2 font-mono text-sm text-accent">
                  {question.unit}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Enter the number only{question.unit ? `, in ${question.unit}` : ''}. Scientific notation such as 1.2e-3
              works. Answers within a small tolerance are accepted.
            </p>
          </div>
        )}

        {(question.type === 'conceptual' || question.type === 'descriptive') && (
          <div>
            <textarea
              autoFocus
              rows={question.type === 'descriptive' ? 10 : 6}
              aria-label="Your answer"
              maxLength={MAX_ANSWER_CHARS}
              disabled={disabled}
              value={text}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write your answer. Explain your reasoning and use correct chemistry terms."
              className={`${inputClass} resize-y leading-relaxed`}
            />
            <p className={`mt-2 text-right text-xs ${nearLimit ? 'text-amber-500' : 'text-muted'}`}>
              {text.length}/{MAX_ANSWER_CHARS}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}