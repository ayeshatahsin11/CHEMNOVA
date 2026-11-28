import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import ConfirmModal from '../ui/ConfirmModal'
import FormAlert from '../auth/FormAlert'
import ThinkingIndicator from '../viva/ThinkingIndicator'
import { gameMeta } from '../../lib/games'
import { panelClass } from '../../lib/viva'

export default function BattlePlay({ round, questions, onFinish, submitting, error, onExit }) {
  const meta = gameMeta.battle
  const storeKey = `chemnova-battle-${round.id}`
  const total = questions.length

  // Answers are kept in this tab, so a reload does not lose them
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey))
      return saved && typeof saved === 'object' ? saved : {}
    } catch {
      return {}
    }
  })
  const answersRef = useRef(answers)
  const sent = useRef(false)
  const [leaving, setLeaving] = useState(false)

  // Time is measured on the server clock, corrected for this device's clock
  const [offset] = useState(() => new Date(round.serverNow).getTime() - Date.now())
  const deadline = new Date(round.startedAt).getTime() + round.durationSec * 1000
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  useEffect(
    () => () => {
      if (!sent.current) return
      try {
        sessionStorage.removeItem(storeKey)
      } catch {
        // nothing to clean up
      }
    },
    [storeKey],
  )

  const remaining = Math.max(0, deadline - (now + offset))
  const index = questions.findIndex((q) => answers[q.id] === undefined)
  const finished = remaining <= 0 || index === -1
  const q = index === -1 ? null : questions[index]

  const send = () =>
    onFinish(Object.entries(answersRef.current).map(([questionId, choice]) => ({ questionId, choice })))

  // At zero seconds, or after the last question, the round is sent in once
  useEffect(() => {
    if (finished && !sent.current) {
      sent.current = true
      send()
    }
  })

  const pick = (choice) => {
    if (finished || !q) return

    const next = { ...answersRef.current, [q.id]: choice }
    answersRef.current = next
    setAnswers(next)
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(next))
    } catch {
      // the answers just will not survive a reload
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || finished) return
      if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault()
        pick(0)
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault()
        pick(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const seconds = Math.ceil(remaining / 1000)
  const urgent = remaining <= 10_000
  const answered = Object.keys(answers).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient}`}>
            <meta.icon size={21} className="text-[#04121c]" />
          </span>
          <div>
            <h2 className="font-semibold">{meta.name}</h2>
            <p className="text-xs text-muted">
              {answered} of {total} answered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            role="timer"
            aria-label="Time remaining"
            className={`rounded-xl border px-4 py-2 font-mono text-2xl font-bold tabular-nums ${
              urgent ? 'animate-pulse border-red-500/50 bg-red-500/10 text-red-500' : 'border-border bg-surface-2/70'
            }`}
          >
            {seconds}s
          </span>
          <button type="button" onClick={() => setLeaving(true)} className="btn-outline text-sm">
            <ArrowLeft size={16} /> Exit
          </button>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
            urgent ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-cyan-400 to-violet-500'
          }`}
          style={{ width: `${(remaining / (round.durationSec * 1000)) * 100}%` }}
        />
      </div>

      {!finished && q && (
        <div className={panelClass}>
          <div className="flex items-center justify-between text-xs">
            <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-accent">{q.tag}</span>
            <span className="font-mono text-muted">
              {index + 1} / {total}
            </span>
          </div>

          <p className="mt-5 text-center text-xl leading-relaxed font-semibold sm:text-2xl">{q.prompt}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {q.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2/50 p-5 text-center transition duration-200 hover:-translate-y-1 hover:border-accent/60 hover:bg-accent/10 active:scale-95"
              >
                <span className="text-2xl font-bold">{option}</span>
                <kbd className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                  {i === 0 ? '←' : '→'}
                </kbd>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Answers are checked when time is up, so keep going. There is no going back.
          </p>
        </div>
      )}

      {finished && (
        <div className={panelClass}>
          <h3 className="text-lg font-semibold">{remaining <= 0 ? "Time's up!" : 'All questions answered!'}</h3>

          {submitting && (
            <div className="mt-4">
              <ThinkingIndicator text="Checking your answers..." />
            </div>
          )}

          <div className="mt-4">
            <FormAlert message={error} />
          </div>

          {error && !submitting && (
            <button type="button" onClick={send} className="btn-glow">
              <RefreshCw size={17} /> Try sending again
            </button>
          )}

          {submitting && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Loader2 size={13} className="animate-spin" /> This only takes a moment.
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        open={leaving}
        icon={ArrowLeft}
        title="Leave the battle?"
        message="The clock keeps running on our server, and your answers will not be scored."
        confirmLabel="Leave battle"
        cancelLabel="Keep playing"
        onConfirm={onExit}
        onCancel={() => setLeaving(false)}
      />
    </div>
  )
}