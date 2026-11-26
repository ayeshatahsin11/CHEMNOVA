import { useEffect, useRef } from 'react'
import { ArrowRight, Flag, Loader2, Lightbulb, AlertTriangle, SkipForward, Volume2 } from 'lucide-react'
import ScoreBars from './ScoreBars'
import ThinkingIndicator from './ThinkingIndicator'
import useVoicePrefs from '../../hooks/useVoicePrefs'
import useSpeechOutput from '../../hooks/useSpeechOutput'
import { panelClass, scoreClass } from '../../lib/viva'

const icons = { next: ArrowRight, review: SkipForward, finish: Flag }

// action: 'next' | 'review' | 'finish'. voice: read the feedback aloud.
export default function FeedbackCard({ question, action, label, finishing, onAction, voice = false }) {
  const Icon = icons[action]
  const building = finishing && action === 'finish'

  const [prefs] = useVoicePrefs()
  const { supported, speaking, speak, stop } = useSpeechOutput(prefs.lang)

  const spoken =
    `You scored ${Math.round(question.overall)} percent. ${question.feedback}` +
    (question.misconception ? ` A misconception to fix: ${question.misconception}` : '')

  const latest = useRef({})
  useEffect(() => {
    latest.current = { speak, spoken, auto: voice && prefs.autoRead && supported }
  })

  // Read the feedback when it appears, and stop when the card goes away
  useEffect(() => {
    if (latest.current.auto) latest.current.speak(latest.current.spoken)
    return () => stop()
  }, [question.id, stop])

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

        <div className="flex items-center gap-2">
          {voice && supported && (
            <button
              type="button"
              onClick={() => speak(spoken)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium transition hover:border-accent/50"
            >
              <Volume2 size={14} className={speaking ? 'animate-pulse text-accent' : ''} />
              {speaking ? 'Speaking...' : 'Replay feedback'}
            </button>
          )}
          <span className={`rounded-full px-3 py-1 font-mono text-sm font-semibold ${scoreClass(question.overall)}`}>
            {Math.round(question.overall)}%
          </span>
        </div>
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