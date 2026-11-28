import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Flag, Flame, Loader2, Search, X } from 'lucide-react'
import { checkAnswer, revealClue, submitRound } from '../../api/games'
import ConfirmModal from '../ui/ConfirmModal'
import FormAlert from '../auth/FormAlert'
import ThinkingIndicator from '../viva/ThinkingIndicator'
import { gameMeta, mysteryWorth } from '../../lib/games'
import { panelClass } from '../../lib/viva'

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

export default function ClassicPlay({ round, initialQuestions, initialProgress, onDone, onExit, onReload }) {
  const meta = gameMeta[round.game]

  const [questions, setQuestions] = useState(initialQuestions)
  const [index, setIndex] = useState(() => {
    const first = initialQuestions.findIndex((q) => !q.answered)
    return first === -1 ? initialQuestions.length : first
  })
  const [fb, setFb] = useState(null) // feedback for the current question once it has been answered
  const [streak, setStreak] = useState(initialProgress?.streak ?? 0)
  const [score, setScore] = useState(initialProgress?.score ?? 0)
  const [busy, setBusy] = useState(null) // null | 'check' | 'reveal' | 'submit'
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  const choices = useRef(new Map())
  const nextRef = useRef(null)

  const total = questions.length
  const q = questions[index] ?? null
  const isLast = index === total - 1
  const answeredCount = Math.min(total, index + (fb ? 1 : 0))
  const working = Boolean(busy)

  const fail = (err) => {
    setError(err.message)
    // 409 means this screen is out of step with the server, so load the real state
    if (err.status === 409) onReload()
  }

  const choose = async (choice) => {
    if (working || fb || !q) return

    setBusy('check')
    setError('')
    try {
      const res = await checkAnswer(round.id, { questionId: q.id, choice })
      choices.current.set(q.id, choice)
      setFb({ choice, ...res })
      setStreak(res.streak)
      setScore(res.score)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(null)
    }
  }

  const reveal = async () => {
    if (working || fb || !q) return

    setBusy('reveal')
    setError('')
    try {
      const res = await revealClue(round.id, q.id)
      setQuestions((list) => list.map((x) => (x.id === q.id ? { ...x, clues: [...x.clues, res.clue] } : x)))
    } catch (err) {
      fail(err)
    } finally {
      setBusy(null)
    }
  }

  const finish = async () => {
    if (working) return

    setBusy('submit')
    setError('')
    try {
      const answers = [...choices.current].map(([questionId, choice]) => ({ questionId, choice }))
      onDone(await submitRound(round.id, answers))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const next = () => {
    setFb(null)
    setError('')
    setIndex((i) => i + 1)
    toTop()
  }

  // Keys 1 to 4 pick an option
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !q || fb || working) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault()
        choose(n - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // After feedback appears, the Next button gets focus, so Enter moves on
  useEffect(() => {
    if (fb) nextRef.current?.focus()
  }, [fb])

  const exitMessage =
    round.game === 'daily'
      ? "Your progress is saved, and you can pick today's challenge up again from the Fun Zone."
      : 'Your progress in this round is not saved, and starting a new round begins fresh.'

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
              {q ? `Question ${index + 1} of ${total}` : 'All questions answered'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            title="Correct answers in a row"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums ${
              streak >= 2
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-500'
                : 'border-border bg-surface-2/70 text-muted'
            }`}
          >
            <Flame size={16} className={streak >= 2 ? 'animate-pulse' : ''} /> {streak}
          </span>
          <span className="rounded-xl border border-border bg-surface-2/70 px-3 py-2 font-mono text-sm font-semibold tabular-nums">
            {score} pts
          </span>
          <button type="button" onClick={() => setLeaving(true)} disabled={working} className="btn-outline text-sm disabled:opacity-60">
            <ArrowLeft size={16} /> Exit
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs text-muted">
          <span>
            {answeredCount} of {total} answered
          </span>
          <span>{Math.round((answeredCount / total) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            animate={{ width: `${(answeredCount / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <FormAlert message={error} />

      {q ? (
        <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={panelClass}>
          <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-xs text-accent">{q.tag}</span>
          <p className="mt-4 text-lg leading-relaxed font-medium">{q.prompt}</p>

          {q.kind === 'mystery' && (
            <div className="mt-5 rounded-xl border border-border bg-surface-2/40 p-4">
              <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">
                <Search size={13} /> Clues ({q.clues.length} of {q.clueCount})
              </p>
              <ol className="mt-3 space-y-2">
                {q.clues.map((clue, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 font-mono text-[11px] text-accent">
                      {i + 1}
                    </span>
                    {clue}
                  </li>
                ))}
              </ol>

              {!fb && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-muted">
                    Worth {mysteryWorth(q.clues.length)} points now
                  </span>
                  {q.clues.length < q.clueCount && (
                    <button
                      type="button"
                      onClick={reveal}
                      disabled={working}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium transition hover:border-accent/50 disabled:opacity-60"
                    >
                      {busy === 'reveal' ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                      Reveal next clue (worth {mysteryWorth(q.clues.length + 1)})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div role="group" aria-label="Answer options" className="mt-6 space-y-3">
            {q.options.map((option, i) => {
              const right = fb && i === fb.correctIndex
              const wrongPick = fb && i === fb.choice && !fb.correct

              let tone = 'border-border bg-surface-2/50 hover:-translate-y-0.5 hover:border-accent/50'
              if (fb) {
                tone = right
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : wrongPick
                    ? 'border-red-500/60 bg-red-500/10'
                    : 'border-border bg-surface-2/30 opacity-60'
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={Boolean(fb) || working}
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition duration-300 disabled:cursor-default ${tone}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-xs font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{option}</span>
                  {right && <Check size={18} className="shrink-0 text-emerald-500" />}
                  {wrongPick && <X size={18} className="shrink-0 text-red-500" />}
                </button>
              )
            })}
          </div>

          {busy === 'check' && <p className="mt-4 text-xs text-muted">Checking your answer...</p>}
          {!fb && !working && <p className="mt-4 text-xs text-muted">Tip: press {q.options.length === 2 ? '1 or 2' : '1 to 4'} to answer.</p>}

          {fb && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-xl border p-4 ${
                fb.correct ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'
              }`}
            >
              <p className={`font-semibold ${fb.correct ? 'text-emerald-500' : 'text-red-500'}`}>
                {fb.correct ? `Correct! +${fb.points} points` : 'Not quite'}
                {fb.correct && fb.streak > 1 && <span className="font-normal"> · {fb.streak} in a row</span>}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{fb.explanation}</p>
            </motion.div>
          )}

          {busy === 'submit' && (
            <div className="mt-6">
              <ThinkingIndicator text="Adding up your score..." />
            </div>
          )}

          {fb && (
            <div className="mt-6">
              {isLast ? (
                <button ref={nextRef} type="button" onClick={finish} disabled={working} className="btn-glow disabled:pointer-events-none disabled:opacity-60">
                  {busy === 'submit' ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Scoring...
                    </>
                  ) : (
                    <>
                      <Flag size={17} /> See my results
                    </>
                  )}
                </button>
              ) : (
                <button ref={nextRef} type="button" onClick={next} className="btn-glow">
                  Next question <ArrowRight size={17} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <div className={panelClass}>
          <h3 className="text-lg font-semibold">All questions answered</h3>
          <p className="mt-1 text-sm text-muted">Finish to see your score and the explanations.</p>
          <button type="button" onClick={finish} disabled={working} className="btn-glow mt-6 disabled:pointer-events-none disabled:opacity-60">
            {busy === 'submit' ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Scoring...
              </>
            ) : (
              <>
                <Flag size={17} /> Finish and see results
              </>
            )}
          </button>
        </div>
      )}

      <ConfirmModal
        open={leaving}
        icon={ArrowLeft}
        title="Leave this round?"
        message={exitMessage}
        confirmLabel="Leave round"
        cancelLabel="Keep playing"
        onConfirm={onExit}
        onCancel={() => setLeaving(false)}
      />
    </div>
  )
}