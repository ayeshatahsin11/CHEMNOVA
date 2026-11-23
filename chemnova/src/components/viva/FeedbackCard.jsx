import { ArrowRight, Flag, Loader2, Lightbulb, AlertTriangle, SkipForward } from 'lucide-react'
import ScoreBars from './ScoreBars'
import ThinkingIndicator from './ThinkingIndicator'
import { panelClass, scoreClass } from '../../lib/viva'

const icons = { next: ArrowRight, review: SkipForward, finish: Flag }

// action: 'next' | 'review' | 'finish'
export default function FeedbackCard({ question, action, label, finishing, onAction }) {
  const Icon = icons[action]
  const building = finishing && action === 'finish'

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
            <Lightbulb size={19} className="text-[#04121c]" />
          </span>
          <div>
            <h3 className="font-semibold">Examiner feedback</h3>
            <p className="text-xs text-muted">Question {question.order}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 font-mono text-sm font-semibold ${scoreClass(question.overall)}`}>
          {Math.round(question.overall)}%
        </span>
      </div>

      <p className="mt-4 text-sm text-muted">{question.question}</p>
      <p className="mt-4 text-sm leading-relaxed">{question.feedback}</p>

      {question.misconception && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Misconception spotted: </span>
            {question.misconception}
          </p>
        </div>
      )}

      <div className="mt-6">
        <ScoreBars scores={question.scores} max={10} />
      </div>

      {building && (
        <div className="mt-6">
          <ThinkingIndicator text="Writing your report..." />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onAction}
          disabled={finishing}
          className="btn-glow disabled:pointer-events-none disabled:opacity-60"
        >
          {building ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Building report...
            </>
          ) : (
            <>
              {label} <Icon size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}