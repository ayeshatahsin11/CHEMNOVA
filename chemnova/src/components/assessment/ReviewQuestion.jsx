import { Check, Circle, X, ChevronDown } from 'lucide-react'
import { typeMeta, AI_GRADED_TYPES, formatMarks, formatNumber } from '../../lib/assessment'
import { scoreClass } from '../../lib/viva'

const letters = ['A', 'B', 'C', 'D']
const label = 'text-xs tracking-wide text-muted uppercase'

function ResultChip({ result }) {
  if (!result) return null
  if (result.pending) {
    return <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">Pending</span>
  }
  if (!result.answered) {
    return <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">Not answered</span>
  }
  const pct = result.max ? (result.earned / result.max) * 100 : 0
  return (
    <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${scoreClass(pct)}`}>
      {formatMarks(result.earned)}/{result.max}
    </span>
  )
}

function yourAnswer(q) {
  const r = q.response
  if (r === null || r === undefined || r === '') return null
  if (q.type === 'mcq') return `${letters[r]}. ${q.options[r]}`
  if (q.type === 'true_false') return r ? 'True' : 'False'
  return String(r)
}

export default function ReviewQuestion({ q, index }) {
  const meta = typeMeta[q.type]
  const r = q.result
  const written = AI_GRADED_TYPES.includes(q.type)
  const given = yourAnswer(q)
  const unit = q.unit ? ` ${q.unit}` : ''

  return (
    <details className="group rounded-xl border border-border bg-surface-2/40 open:bg-surface-2/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-xs text-muted">Q{index + 1}</span>
        <span className="min-w-0 flex-1 truncate">{q.prompt}</span>
        <ResultChip result={r} />
        <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-accent">
            <meta.icon size={12} /> {meta.label}
          </span>
          <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5">{q.topicTag}</span>
          {written && <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-secondary">Graded by AI</span>}
        </div>

        <p className="leading-relaxed font-medium">{q.prompt}</p>

        {q.type === 'mcq' && (
          <ul className="space-y-2">
            {q.options.map((option, i) => {
              const correct = i === q.correctIndex
              const chosen = q.response === i
              return (
                <li
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    correct
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : chosen
                        ? 'border-red-500/40 bg-red-500/10'
                        : 'border-border'
                  }`}
                >
                  <span className="font-mono text-xs text-muted">{letters[i]}</span>
                  <span className="flex-1">{option}</span>
                  {correct && (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <Check size={14} /> Correct
                    </span>
                  )}
                  {chosen && !correct && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <X size={14} /> Your answer
                    </span>
                  )}
                  {chosen && correct && <span className="text-xs text-emerald-500">Your answer</span>}
                </li>
              )
            })}
          </ul>
        )}

        {q.type === 'true_false' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={label}>Your answer</p>
              <p className="mt-1">{given ?? 'Not answered'}</p>
            </div>
            <div>
              <p className={label}>Correct answer</p>
              <p className="mt-1 text-emerald-500">{q.correctBool ? 'True' : 'False'}</p>
            </div>
          </div>
        )}

        {q.type === 'fill_blank' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={label}>Your answer</p>
              <p className="mt-1">{given ?? 'Not answered'}</p>
            </div>
            <div>
              <p className={label}>Accepted answers</p>
              <p className="mt-1 text-emerald-500">{q.acceptedAnswers.join(', ')}</p>
            </div>
          </div>
        )}

        {q.type === 'numerical' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={label}>Your answer</p>
              <p className="mt-1 font-mono">{given ?? 'Not answered'}</p>
              {r?.feedback?.startsWith('We could not read') && (
                <p className="mt-1 text-xs text-amber-500">{r.feedback}</p>
              )}
            </div>
            <div>
              <p className={label}>Correct answer</p>
              <p className="mt-1 font-mono text-emerald-500">
                {formatNumber(q.correctValue)}
                {unit}
              </p>
              <p className="mt-0.5 text-xs text-muted">Accepted within {q.tolerancePct}%</p>
            </div>
          </div>
        )}

        {written && (
          <>
            <div>
              <p className={label}>Your answer</p>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">{given ?? 'Not answered'}</p>
            </div>
            <div>
              <p className={label}>Model answer</p>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap text-emerald-500">{q.modelAnswer}</p>
            </div>
            <div>
              <p className={label}>Key points</p>
              <ul className="mt-2 space-y-1.5">
                {q.keyPoints.map((point, j) => {
                  const hit = r?.covered?.includes(j)
                  return (
                    <li key={j} className="flex items-start gap-2">
                      {hit ? (
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle size={15} className="mt-0.5 shrink-0 text-muted" />
                      )}
                      <span className={hit ? '' : 'text-muted'}>{point}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}

        {r?.gradedBy === 'ai' && !r.pending && r.feedback && (
          <div className="rounded-lg border border-border bg-surface-2/60 px-4 py-3">
            <p className={label}>AI feedback</p>
            <p className="mt-1 leading-relaxed">{r.feedback}</p>
          </div>
        )}

        {!written && q.explanation && (
          <div>
            <p className={label}>Explanation</p>
            <p className="mt-1 leading-relaxed text-muted">{q.explanation}</p>
          </div>
        )}
      </div>
    </details>
  )
}