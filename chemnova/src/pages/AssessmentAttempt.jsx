import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Flag, AlertCircle, RefreshCw, SearchX, Check, Loader2, CloudOff, Clock,
} from 'lucide-react'
import { getAttempt, saveAnswers, submitAttempt, regradeAttempt, startAttempt } from '../api/assessments'
import { isAnswered, plural } from '../lib/assessment'
import { panelClass } from '../lib/viva'
import SpotlightCard from '../components/ui/SpotlightCard'
import ConfirmModal from '../components/ui/ConfirmModal'
import FormAlert from '../components/auth/FormAlert'
import ExamTimer from '../components/assessment/ExamTimer'
import QuestionCard from '../components/assessment/QuestionCard'
import QuestionNavigator from '../components/assessment/QuestionNavigator'
import AssessmentResults from '../components/assessment/AssessmentResults'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'
const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const enter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

function SaveStatus({ state }) {
  if (state === 'saving' || state === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Loader2 size={13} className="animate-spin" /> Saving...
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-500">
        <CloudOff size={13} /> Could not save. Retrying...
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <Check size={13} className="text-emerald-500" /> All changes saved
    </span>
  )
}

function AttemptView({ id }) {
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [data, setData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [offset, setOffset] = useState(0)
  const [current, setCurrent] = useState(0)
  const [saveState, setSaveState] = useState('saved')
  const [modal, setModal] = useState(null) // null | 'submit' | 'exit'
  const [submitting, setSubmitting] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [regrading, setRegrading] = useState(false)
  const [retaking, setRetaking] = useState(false)
  const [actionError, setActionError] = useState('')

  const answersRef = useRef({})
  const dirty = useRef(new Set())
  const saveTimer = useRef(null)
  const submittingRef = useRef(false)
  const inExam = useRef(false)

  useEffect(() => {
    let cancelled = false
    getAttempt(id).then(
      (res) => {
        if (cancelled) return
        setData(res)
        if (res.attempt.status === 'in_progress') {
          answersRef.current = res.answers ?? {}
          setAnswers(res.answers ?? {})
          // Correct for a device clock that is wrong: server time = device time + offset
          setOffset(new Date(res.attempt.serverNow).getTime() - Date.now())
          setCurrent(0)
          setTimeUp(false)
          submittingRef.current = false
        }
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
  }, [id, reload])

  useEffect(() => {
    inExam.current = data?.attempt.status === 'in_progress'
  }, [data])

  // Leaving the page: send the last unsaved typing
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current)
      if (inExam.current && dirty.current.size) {
        const payload = [...dirty.current].map((q) => ({ questionId: q, response: answersRef.current[q] ?? null }))
        saveAnswers(id, payload).catch(() => {})
      }
    }
  }, [id])

  if (load.status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading">
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
          <h2 className="mt-4 text-lg font-semibold">Attempt not found</h2>
          <p className="mt-1 text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
          <Link to="/assessments" className="btn-glow mt-6">
            <ArrowLeft size={17} /> Back to Assessment Studio
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
          <h2 className="mt-4 text-lg font-semibold">We could not load this attempt</h2>
          <p className="mt-1 text-sm text-muted">{load.message}</p>
          <button
            onClick={() => {
              setLoad({ status: 'loading', message: '' })
              setReload((n) => n + 1)
            }}
            className="btn-glow mt-6"
          >
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  // ---- ready ----
  const { assessment } = data
  const exam = data.attempt.status === 'in_progress'

  // Sends the answers that changed since the last save
  const flush = async () => {
    clearTimeout(saveTimer.current)
    if (!dirty.current.size || submittingRef.current) return true

    const ids = [...dirty.current]
    dirty.current = new Set()
    setSaveState('saving')
    try {
      await saveAnswers(
        id,
        ids.map((q) => ({ questionId: q, response: answersRef.current[q] ?? null })),
      )
      setSaveState(dirty.current.size ? 'pending' : 'saved')
      return true
    } catch (err) {
      ids.forEach((q) => dirty.current.add(q))
      if (err.status === 409) {
        // The attempt ended or time is up: load the real state from the server
        setReload((n) => n + 1)
        return false
      }
      setSaveState('error')
      saveTimer.current = setTimeout(flush, 5000)
      return false
    }
  }

  const setAnswer = (questionId, value) => {
    answersRef.current = { ...answersRef.current, [questionId]: value }
    setAnswers(answersRef.current)
    dirty.current.add(questionId)
    setSaveState('pending')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flush, 1200)
  }

  const goTo = (i) => {
    setCurrent(i)
    setActionError('')
    flush()
    toTop()
  }

  const submit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    clearTimeout(saveTimer.current)
    setSubmitting(true)
    setActionError('')
    try {
      const payload = Object.entries(answersRef.current).map(([questionId, response]) => ({ questionId, response }))
      const review = await submitAttempt(id, payload)
      dirty.current = new Set()
      setData(review)
      setModal(null)
      toTop()
    } catch (err) {
      submittingRef.current = false
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExpire = () => {
    setTimeUp(true)
    setModal(null)
    submit()
  }

  const confirmExit = async () => {
    await flush()
    navigate(`/assessments/${assessment.id}`)
  }

  const regrade = async () => {
    setRegrading(true)
    setActionError('')
    try {
      setData(await regradeAttempt(id))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setRegrading(false)
    }
  }

  const retake = async () => {
    setRetaking(true)
    setActionError('')
    try {
      const res = await startAttempt(assessment.id)
      navigate(`/assessments/attempt/${res.attempt.id}`)
    } catch (err) {
      setActionError(err.message)
      setRetaking(false)
    }
  }

  // ---- results ----
  if (!exam) {
    return (
      <div className="mx-auto max-w-5xl">
        <motion.div key="results" {...enter}>
          <AssessmentResults
            data={data}
            onRegrade={regrade}
            regrading={regrading}
            onRetake={retake}
            retaking={retaking}
            error={actionError}
          />
        </motion.div>
      </div>
    )
  }

  // ---- exam ----
  const questions = data.questions
  const total = questions.length
  const question = questions[current]
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length
  const unanswered = total - answeredCount
  const deadline = data.attempt.deadline ? new Date(data.attempt.deadline).getTime() : null
  const locked = submitting || timeUp

  const submitMessage = submitting
    ? 'Grading your answers. Written answers are graded by AI, so this can take a little while.'
    : unanswered
      ? `You have ${plural(unanswered, 'unanswered question')}. ${unanswered === 1 ? 'It' : 'They'} will score 0 if you submit now.`
      : 'You have answered every question. Submit to see your score and the correct answers.'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="font-mono text-xs text-accent">// assessment</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{assessment.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={chip}>{assessment.level}</span>
            <span className={chip}>{assessment.difficulty}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {deadline ? (
            <ExamTimer deadline={deadline} offset={offset} onExpire={handleExpire} />
          ) : (
            <span className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/70 px-3 py-2 text-sm text-muted">
              <Clock size={16} /> Untimed
            </span>
          )}
          <button type="button" onClick={() => setModal('exit')} disabled={locked} className="btn-outline text-sm disabled:opacity-60">
            <ArrowLeft size={16} /> Exit
          </button>
          <button
            type="button"
            onClick={() => setModal('submit')}
            disabled={locked}
            className="btn-glow text-sm disabled:pointer-events-none disabled:opacity-60"
          >
            <Flag size={16} /> Submit
          </button>
        </div>
      </div>

      {timeUp && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Time is up. Your answers are being submitted automatically.</p>
          {!submitting && (
            <button type="button" onClick={submit} className="btn-outline shrink-0 text-sm">
              Submit now
            </button>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            {answeredCount} of {total} answered
          </span>
          <SaveStatus state={saveState} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            animate={{ width: `${(answeredCount / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <QuestionNavigator questions={questions} answers={answers} current={current} onSelect={goTo} disabled={locked} />

      {!modal && <FormAlert message={actionError} />}

      <motion.div key={question.id} {...enter}>
        <QuestionCard
          question={question}
          index={current}
          total={total}
          value={answers[question.id]}
          onChange={(value) => setAnswer(question.id, value)}
          disabled={locked}
        />
      </motion.div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0 || locked}
          className="btn-outline disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft size={17} /> Previous
        </button>

        {current < total - 1 ? (
          <button type="button" onClick={() => goTo(current + 1)} disabled={locked} className="btn-glow disabled:opacity-60">
            Next <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" onClick={() => setModal('submit')} disabled={locked} className="btn-glow disabled:opacity-60">
            <Flag size={17} /> Review and submit
          </button>
        )}
      </div>

      <ConfirmModal
        open={modal === 'submit'}
        icon={Flag}
        title="Submit your answers?"
        message={submitMessage}
        confirmLabel="Submit answers"
        cancelLabel="Keep working"
        busy={submitting}
        error={actionError}
        onConfirm={submit}
        onCancel={() => !submitting && setModal(null)}
      />

      <ConfirmModal
        open={modal === 'exit'}
        icon={ArrowLeft}
        title="Leave this exam?"
        message={
          deadline
            ? 'Your answers are saved, but the timer keeps running while you are away. You can resume from the assessment page.'
            : 'Your answers are saved. You can resume from the assessment page any time.'
        }
        confirmLabel="Leave exam"
        cancelLabel="Stay"
        onConfirm={confirmExit}
        onCancel={() => setModal(null)}
      />
    </div>
  )
}

export default function AssessmentAttemptPage() {
  const { id } = useParams()
  // The key resets all state when the URL changes to another attempt (a retake, for example)
  return <AttemptView key={id} id={id} />
}