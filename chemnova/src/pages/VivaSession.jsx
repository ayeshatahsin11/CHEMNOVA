import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bot, SkipForward, Send, Flag, Loader2, AlertCircle, RefreshCw,
  CornerDownRight, ChevronDown, SearchX,
} from 'lucide-react'
import { getVivaSession, answerVivaQuestion, finishVivaSession } from '../api/viva'
import { MAX_ANSWER_CHARS, modeLabels, panelClass, scoreClass } from '../lib/viva'
import SpotlightCard from '../components/ui/SpotlightCard'
import FormAlert from '../components/auth/FormAlert'
import FeedbackCard from '../components/viva/FeedbackCard'
import ThinkingIndicator from '../components/viva/ThinkingIndicator'
import VivaReport from '../components/viva/VivaReport'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'
const badge = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const enter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

function EarlierQuestions({ items }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted backdrop-blur transition hover:text-content"
      >
        <span>Earlier questions ({items.length})</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="mt-3 space-y-3">
          {items.map((q) => (
            <li key={q.id} className="rounded-xl border border-border bg-surface/50 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  <span className="mr-2 font-mono text-xs text-muted">Q{q.order}</span>
                  {q.question}
                </p>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${scoreClass(q.overall)}`}>
                  {Math.round(q.overall)}%
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-muted">{q.skipped ? 'Skipped' : q.answer}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{q.feedback}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SessionView({ id }) {
  const [attempt, setAttempt] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [lastResult, setLastResult] = useState(null) // { evaluated, done } while feedback is on screen
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    getVivaSession(id).then(
      (data) => {
        if (cancelled) return
        const answered = data.questions.filter((q) => q.answeredAt)
        const hasOpen = data.questions.some((q) => !q.answeredAt)

        setSession(data.session)
        setQuestions(data.questions)
        // Everything answered but never finished (for example the tab was closed on the last answer):
        // go straight to the finish step.
        setLastResult(
          data.session.status === 'active' && !hasOpen && answered.length
            ? { evaluated: answered[answered.length - 1], done: true }
            : null,
        )
        setLoad({ status: 'ready', message: '' })
      },
      (err) => {
        if (cancelled) return
        const missing = err.status === 404 || err.status === 400
        setLoad({ status: missing ? 'missing' : 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  const retry = () => {
    setLoad({ status: 'loading', message: '' })
    setAttempt((a) => a + 1)
  }

  if (load.status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading viva">
        <div className={`${block} h-28`} />
        <div className={`${block} h-3`} />
        <div className={`${block} h-80`} />
      </div>
    )
  }

  if (load.status === 'missing') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
            <SearchX size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Viva not found</h2>
          <p className="mt-1 text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
          <Link to="/viva" className="btn-glow mt-6">
            <ArrowLeft size={17} /> Back to Viva
          </Link>
        </SpotlightCard>
      </div>
    )
  }

  if (load.status === 'error') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">We could not load this viva</h2>
          <p className="mt-1 text-sm text-muted">{load.message}</p>
          <button onClick={retry} className="btn-glow mt-6">
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  // ---- ready ----
  const completed = session.status === 'completed'
  const total = session.totalQuestions
  const answeredQs = questions.filter((q) => q.answeredAt)
  const current = questions.find((q) => !q.answeredAt) ?? null
  const earlier = answeredQs.filter((q) => q.id !== lastResult?.evaluated.id)

  const submit = async (skip) => {
    if (submitting || !current) return
    if (!skip && !answer.trim()) {
      setActionError('Please write an answer or choose Skip')
      return
    }

    setSubmitting(true)
    setActionError('')
    try {
      const res = await answerVivaQuestion(id, {
        questionId: current.id,
        answer: skip ? '' : answer.trim(),
        skip,
      })
      setQuestions((prev) =>
        prev.map((q) => (q.id === res.evaluated.id ? res.evaluated : q)).concat(res.next ? [res.next] : []),
      )
      setLastResult({ evaluated: res.evaluated, done: res.done })
      setAnswer('')
      toTop()
    } catch (err) {
      setActionError(err.message)
      // 409 means our screen is out of step with the server, so reload the real state
      if (err.status === 409) setAttempt((a) => a + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const finish = async () => {
    if (finishing) return
    setFinishing(true)
    setActionError('')
    try {
      const done = await finishVivaSession(id)
      setSession(done)
      setLastResult(null)
      toTop()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setFinishing(false)
    }
  }

  const goNext = () => {
    setLastResult(null)
    setActionError('')
    toTop()
  }

  const endEarly = () => {
    if (window.confirm('End the exam now? Your report will only count the questions you answered.')) finish()
  }

  let view = null

  if (completed && session.report) {
    view = (
      <motion.div key="report" {...enter}>
        <VivaReport session={session} questions={answeredQs} />
      </motion.div>
    )
  } else if (lastResult) {
    view = (
      <motion.div key={`feedback-${lastResult.evaluated.id}`} {...enter}>
        <FeedbackCard
          question={lastResult.evaluated}
          done={lastResult.done || !current}
          finishing={finishing}
          onNext={goNext}
          onFinish={finish}
        />
      </motion.div>
    )
  } else if (current) {
    const nearLimit = answer.length > MAX_ANSWER_CHARS * 0.9

    view = (
      <motion.div key={`question-${current.id}`} {...enter} className={panelClass}>
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
            <Bot size={22} className="text-[#04121c]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-muted">
                Question {current.order} of {total}
              </span>
              <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-accent">
                {current.topicTag}
              </span>
              {current.isFollowUp && (
                <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-secondary">
                  <CornerDownRight size={12} /> Follow-up
                </span>
              )}
            </div>
            <p className="mt-3 text-lg leading-relaxed font-medium">{current.question}</p>
          </div>
        </div>

        <div className="mt-6">
          <textarea
            autoFocus
            rows={6}
            aria-label="Your answer"
            value={answer}
            maxLength={MAX_ANSWER_CHARS}
            disabled={submitting}
            onChange={(e) => {
              setAnswer(e.target.value)
              setActionError('')
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                submit(false)
              }
            }}
            placeholder="Answer as you would to the examiner in the room..."
            className="w-full resize-y rounded-xl border border-border bg-surface-2/60 p-4 text-sm leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>Ctrl + Enter to submit</span>
            <span className={nearLimit ? 'text-amber-500' : ''}>
              {answer.length}/{MAX_ANSWER_CHARS}
            </span>
          </div>
        </div>

        {submitting && (
          <div className="mt-5">
            <ThinkingIndicator text="Your examiner is reading your answer..." />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={submitting || finishing}
            className="btn-glow disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                <Send size={17} /> Submit answer
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => submit(true)}
            disabled={submitting || finishing}
            className="btn-outline disabled:pointer-events-none disabled:opacity-60"
          >
            <SkipForward size={17} /> Skip
          </button>

          {answeredQs.length >= 1 && (
            <button
              type="button"
              onClick={endEarly}
              disabled={submitting || finishing}
              className="ml-auto flex items-center gap-1.5 text-sm text-muted transition hover:text-content disabled:opacity-60"
            >
              {finishing ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
              End exam
            </button>
          )}
        </div>
      </motion.div>
    )
  } else {
    view = (
      <div className={`${panelClass} text-center text-sm text-muted`}>
        This session has no questions to show.
      </div>
    )
  }

  const progressPct = Math.min(100, (answeredQs.length / total) * 100)

  return (
    <div className={`mx-auto space-y-6 ${completed ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="font-mono text-xs text-accent">// {modeLabels[session.mode] ?? session.mode}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            {session.subject}
            {session.topic && <span className="font-normal text-muted"> · {session.topic}</span>}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={badge}>{session.level}</span>
            <span className={badge}>{session.difficulty}</span>
          </div>
        </div>
        <Link to="/viva" className="btn-outline text-sm">
          <ArrowLeft size={16} /> {completed ? 'All vivas' : 'Exit'}
        </Link>
      </div>

      {!completed && (
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted">
            <span>
              {answeredQs.length} of {total} answered
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      )}

      {!completed && earlier.length > 0 && <EarlierQuestions items={earlier} />}

      <FormAlert message={actionError} />

      {view}
    </div>
  )
}

export default function VivaSessionPage() {
  const { id } = useParams()
  // The key resets all state if the URL changes to a different session
  return <SessionView key={id} id={id} />
}