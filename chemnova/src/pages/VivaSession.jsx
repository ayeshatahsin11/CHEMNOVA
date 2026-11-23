import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bot, SkipForward, Send, Flag, Loader2, AlertCircle, RefreshCw,
  CornerDownRight, ChevronDown, SearchX,
} from 'lucide-react'
import { getVivaSession, answerVivaQuestion, finishVivaSession } from '../api/viva'
import { MAX_ANSWER_CHARS, modeLabels, panelClass, scoreClass } from '../lib/viva'
import SpotlightCard from '../components/ui/SpotlightCard'
import ConfirmModal from '../components/ui/ConfirmModal'
import FormAlert from '../components/auth/FormAlert'
import FeedbackCard from '../components/viva/FeedbackCard'
import QuestionNav from '../components/viva/QuestionNav'
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

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

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
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [viewId, setViewId] = useState(null) // a question picked from the chips (null = the current one)
  const [lastResult, setLastResult] = useState(null) // the evaluated question while its feedback is on screen
  const [drafts, setDrafts] = useState({}) // unsent answers, one per question
  const [pending, setPending] = useState(null) // null | 'answer' | 'skip'
  const [finishing, setFinishing] = useState(false)
  const [modal, setModal] = useState(null) // null | 'skip' | 'end' | 'exit'
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    getVivaSession(id).then(
      (data) => {
        if (cancelled) return
        setSession(data.session)
        setQuestions(data.questions)
        setViewId(null)
        setLastResult(null)
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
  const skippedQs = questions.filter((q) => q.skipped && !q.answeredAt)
  const openQ = questions.find((q) => !q.answeredAt && !q.skipped) ?? null
  // The question on screen: one picked from the chips, otherwise the current one
  const viewQ = questions.find((q) => q.id === viewId && !q.answeredAt) ?? openQ
  const realAnswered = answeredQs.filter((q) => !q.skipped).length
  const earlier = answeredQs.filter((q) => q.id !== lastResult?.id)
  const busy = Boolean(pending) || finishing

  const answer = viewQ ? (drafts[viewQ.id] ?? '') : ''
  const setAnswer = (value) => {
    setDrafts((d) => ({ ...d, [viewQ.id]: value }))
    setActionError('')
  }

  const closeModal = () => setModal(null)

  const goTo = (questionId) => {
    setViewId(questionId)
    setLastResult(null)
    setActionError('')
    toTop()
  }

  const applyResult = (updated, next) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)).concat(next ? [next] : []))
  }

  const handleFailure = (err) => {
    setActionError(err.message)
    // 409 means our screen is out of step with the server, so reload the real state
    if (err.status === 409) setAttempt((a) => a + 1)
  }

  const submitAnswer = async () => {
    if (busy || !viewQ) return
    if (!answer.trim()) {
      setActionError('Please write an answer or choose Skip')
      return
    }

    setPending('answer')
    setActionError('')
    try {
      const res = await answerVivaQuestion(id, { questionId: viewQ.id, answer: answer.trim(), skip: false })
      applyResult(res.evaluated, res.next)
      setDrafts((d) => ({ ...d, [res.evaluated.id]: '' }))
      setLastResult(res.evaluated)
      setViewId(null)
      toTop()
    } catch (err) {
      handleFailure(err)
    } finally {
      setPending(null)
    }
  }

  const confirmSkip = async () => {
    setModal(null)
    if (busy || !viewQ || viewQ.skipped) return

    setPending('skip')
    setActionError('')
    try {
      const res = await answerVivaQuestion(id, { questionId: viewQ.id, answer: '', skip: true })
      applyResult(res.skippedQuestion, res.next)
      setLastResult(null)
      setViewId(null)
      toTop()
    } catch (err) {
      handleFailure(err)
    } finally {
      setPending(null)
    }
  }

  const finish = async () => {
    if (finishing) return false
    setFinishing(true)
    setActionError('')
    try {
      const done = await finishVivaSession(id)
      // Reload the questions so skipped ones show their final score of 0
      try {
        const fresh = await getVivaSession(id)
        setQuestions(fresh.questions)
      } catch {
        // keep what we have, the report itself is already saved
      }
      setSession(done)
      setLastResult(null)
      setViewId(null)
      toTop()
      return true
    } catch (err) {
      setActionError(err.message)
      return false
    } finally {
      setFinishing(false)
    }
  }

  const confirmEnd = async () => {
    if (await finish()) setModal(null)
  }

  const endMessage = [
    `Your report will include the ${plural(realAnswered, 'question')} you answered.`,
    skippedQs.length ? `${plural(skippedQs.length, 'skipped question')} will count as 0.` : '',
    'Any question you have not answered or skipped is left out.',
  ]
    .filter(Boolean)
    .join(' ')

  // What the button under the feedback card does
  const feedbackAction = openQ ? 'next' : skippedQs.length ? 'review' : 'finish'
  const feedbackLabel = openQ
    ? `Continue to question ${openQ.order}`
    : skippedQs.length
      ? 'Review skipped questions'
      : 'Finish and see my report'

  const onFeedbackAction = () => {
    if (feedbackAction === 'finish') return finish()
    if (feedbackAction === 'review') return goTo(skippedQs[0].id)
    return goTo(null)
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
      <motion.div key={`feedback-${lastResult.id}`} {...enter}>
        <FeedbackCard
          question={lastResult}
          action={feedbackAction}
          label={feedbackLabel}
          finishing={finishing}
          onAction={onFeedbackAction}
        />
      </motion.div>
    )
  } else if (viewQ) {
    const nearLimit = answer.length > MAX_ANSWER_CHARS * 0.9
    const revisit = viewQ.skipped
    const willCreateNext = viewQ.order === questions.length && questions.length < total
    const backLabel = openQ && openQ.id !== viewQ.id ? `Back to question ${openQ.order}` : 'Back'

    view = (
      <motion.div key={`question-${viewQ.id}`} {...enter} className={panelClass}>
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
            <Bot size={22} className="text-[#04121c]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-muted">
                Question {viewQ.order} of {total}
              </span>
              <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-accent">
                {viewQ.topicTag}
              </span>
              {viewQ.isFollowUp && (
                <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-secondary">
                  <CornerDownRight size={12} /> Follow-up
                </span>
              )}
              {revisit && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-amber-500">
                  <SkipForward size={12} /> Skipped earlier
                </span>
              )}
            </div>
            <p className="mt-3 text-lg leading-relaxed font-medium">{viewQ.question}</p>
          </div>
        </div>

        <div className="mt-6">
          <textarea
            autoFocus
            rows={6}
            aria-label="Your answer"
            value={answer}
            maxLength={MAX_ANSWER_CHARS}
            disabled={busy}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                submitAnswer()
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

        {pending === 'answer' && (
          <div className="mt-5">
            <ThinkingIndicator text="Your examiner is reading your answer..." />
          </div>
        )}
        {pending === 'skip' && (
          <div className="mt-5">
            <ThinkingIndicator
              text={willCreateNext ? 'Skipping and preparing your next question...' : 'Skipping this question...'}
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submitAnswer}
            disabled={busy}
            className="btn-glow disabled:pointer-events-none disabled:opacity-60"
          >
            {pending === 'answer' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                <Send size={17} /> Submit answer
              </>
            )}
          </button>

          {revisit ? (
            <button
              type="button"
              onClick={() => goTo(null)}
              disabled={busy}
              className="btn-outline disabled:pointer-events-none disabled:opacity-60"
            >
              <ArrowLeft size={17} /> {openQ ? backLabel : 'Back to summary'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModal('skip')}
              disabled={busy}
              className="btn-outline disabled:pointer-events-none disabled:opacity-60"
            >
              {pending === 'skip' ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Skipping...
                </>
              ) : (
                <>
                  <SkipForward size={17} /> Skip
                </>
              )}
            </button>
          )}

          {realAnswered >= 1 && (
            <button
              type="button"
              onClick={() => setModal('end')}
              disabled={busy}
              className="ml-auto flex items-center gap-1.5 text-sm text-muted transition hover:text-content disabled:opacity-60"
            >
              <Flag size={15} /> End exam
            </button>
          )}
        </div>
      </motion.div>
    )
  } else {
    // Every question has been seen: only skipped ones (if any) are still waiting
    const hasSkipped = skippedQs.length > 0

    view = (
      <motion.div key="end" {...enter} className={panelClass}>
        <h3 className="text-lg font-semibold">
          {hasSkipped ? 'You have reached the last question' : 'All questions answered'}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {hasSkipped
            ? `You skipped ${plural(skippedQs.length, 'question')}. Answer them now, or finish and they will count as 0.`
            : 'Finish the exam to see your full report.'}
        </p>

        {hasSkipped && (
          <ul className="mt-5 space-y-2">
            {skippedQs.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(q.id)}
                  disabled={busy}
                  className="flex w-full items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-left text-sm transition hover:border-amber-400 disabled:opacity-60"
                >
                  <span className="font-mono text-xs text-amber-500">Q{q.order}</span>
                  <span className="min-w-0 flex-1 truncate">{q.question}</span>
                  <span className="shrink-0 text-xs font-medium text-amber-500">Answer</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={hasSkipped ? () => setModal('end') : finish}
            disabled={busy || realAnswered === 0}
            className="btn-glow disabled:pointer-events-none disabled:opacity-60"
          >
            {finishing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Building report...
              </>
            ) : (
              <>
                <Flag size={17} /> {hasSkipped ? 'Finish anyway' : 'Finish and see my report'}
              </>
            )}
          </button>
          {realAnswered === 0 && (
            <p className="mt-3 text-xs text-muted">Answer at least one question to get a report.</p>
          )}
        </div>
      </motion.div>
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

        {completed ? (
          <Link to="/viva" className="btn-outline text-sm">
            <ArrowLeft size={16} /> All vivas
          </Link>
        ) : (
          <button type="button" onClick={() => setModal('exit')} className="btn-outline text-sm">
            <ArrowLeft size={16} /> Exit
          </button>
        )}
      </div>

      {!completed && (
        <>
          <div>
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>
                {answeredQs.length} of {total} answered
                {skippedQs.length > 0 && ` · ${skippedQs.length} skipped`}
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

          <QuestionNav
            total={total}
            questions={questions}
            activeId={lastResult ? null : (viewQ?.id ?? null)}
            disabled={busy}
            onSelect={goTo}
          />
        </>
      )}

      {!completed && earlier.length > 0 && <EarlierQuestions items={earlier} />}

      <FormAlert message={actionError} />

      {view}

      <ConfirmModal
        open={modal === 'skip'}
        icon={SkipForward}
        title="Skip this question?"
        message="You can come back to it from the question list before you finish. If you finish without answering it, it counts as 0."
        confirmLabel="Skip question"
        cancelLabel="Keep answering"
        onConfirm={confirmSkip}
        onCancel={closeModal}
      />

      <ConfirmModal
        open={modal === 'end'}
        icon={Flag}
        title="End the exam now?"
        message={endMessage}
        confirmLabel="End and see report"
        cancelLabel="Keep going"
        busy={finishing}
        error={actionError}
        onConfirm={confirmEnd}
        onCancel={() => !finishing && setModal(null)}
      />

      <ConfirmModal
        open={modal === 'exit'}
        icon={ArrowLeft}
        title="Leave this viva?"
        message="Your progress is saved. You can resume this viva any time from the Viva page."
        confirmLabel="Leave viva"
        cancelLabel="Stay"
        onConfirm={() => navigate('/viva')}
        onCancel={closeModal}
      />
    </div>
  )
}

export default function VivaSessionPage() {
  const { id } = useParams()
  // The key resets all state if the URL changes to a different session
  return <SessionView key={id} id={id} />
}