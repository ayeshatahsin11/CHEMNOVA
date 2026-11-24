import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Play, RotateCcw, Trash2, Clock, ShieldCheck, Loader2, AlertCircle,
  RefreshCw, SearchX, Info, History, Inbox,
} from 'lucide-react'
import { getAssessment, startAttempt, deleteAssessment } from '../api/assessments'
import { typeMeta, typeOrder } from '../lib/assessment'
import { formatDuration, panelClass, scoreClass } from '../lib/viva'
import { timeAgo } from '../lib/format'
import SpotlightCard from '../components/ui/SpotlightCard'
import ConfirmModal from '../components/ui/ConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import FormAlert from '../components/auth/FormAlert'
import PanelHeader from '../components/dashboard/PanelHeader'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'
const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

function DetailView({ id }) {
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice

  const [reload, setReload] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [data, setData] = useState(null)
  const [starting, setStarting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAssessment(id).then(
      (res) => {
        if (cancelled) return
        setData(res)
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

  if (load.status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading assessment">
        <div className={`${block} h-44`} />
        <div className="grid gap-6 md:grid-cols-2">
          <div className={`${block} h-64`} />
          <div className={`${block} h-64`} />
        </div>
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
          <h2 className="mt-4 text-lg font-semibold">Assessment not found</h2>
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
          <h2 className="mt-4 text-lg font-semibold">We could not load this assessment</h2>
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

  const { assessment, attempts, inProgressAttemptId } = data
  const timed = assessment.durationMinutes > 0

  const start = async () => {
    setStarting(true)
    setError('')
    try {
      const res = await startAttempt(assessment.id)
      navigate(`/assessments/attempt/${res.attempt.id}`)
    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteAssessment(assessment.id)
      navigate('/assessments')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const rules = [
    'Your answers save automatically as you work.',
    timed
      ? `The ${assessment.durationMinutes}-minute timer runs on our server. At zero, your answers are submitted automatically.`
      : 'This test is untimed, so you can take as long as you need.',
    'Multiple choice, true/false, fill-in and numerical answers are graded instantly by code.',
    'Conceptual and descriptive answers are graded by AI against a model answer, so they can take a little longer.',
    'Questions are written by AI and can contain mistakes. Check anything surprising with your textbook.',
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500">
          <Info size={16} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />

        <div className="relative">
          <p className="font-mono text-xs text-accent">// ready when you are</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{assessment.title}</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={chip}>{assessment.level}</span>
            <span className={chip}>{assessment.difficulty}</span>
            <span className={chip}>{assessment.questionCount} questions</span>
            <span className={chip}>{assessment.totalMarks} marks</span>
            <span className={`${chip} flex items-center gap-1`}>
              <Clock size={12} /> {timed ? `${assessment.durationMinutes} minutes` : 'Untimed'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {typeOrder
              .filter((t) => assessment.types.includes(t))
              .map((t) => {
                const meta = typeMeta[t]
                return (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
                    <meta.icon size={12} /> {meta.label}
                  </span>
                )
              })}
          </div>

          {inProgressAttemptId && timed && (
            <p className="mt-4 flex items-start gap-2 text-sm text-amber-500">
              <Info size={16} className="mt-0.5 shrink-0" />
              You have an exam in progress. Its timer keeps running, even while you are away.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {inProgressAttemptId ? (
              <Link to={`/assessments/attempt/${inProgressAttemptId}`} className="btn-glow">
                <Play size={17} /> Resume exam
              </Link>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={starting}
                className="btn-glow disabled:pointer-events-none disabled:opacity-60"
              >
                {starting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Starting...
                  </>
                ) : attempts.length ? (
                  <>
                    <RotateCcw size={17} /> Retake
                  </>
                ) : (
                  <>
                    <Play size={17} /> Start exam
                  </>
                )}
              </button>
            )}

            <Link to="/assessments" className="btn-outline">
              <ArrowLeft size={17} /> All assessments
            </Link>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-outline hover:!border-red-500/50 hover:!text-red-500"
            >
              <Trash2 size={17} /> Delete
            </button>
          </div>
        </div>
      </div>

      <FormAlert message={error} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className={panelClass}>
          <PanelHeader icon={ShieldCheck} title="How it works" subtitle="Before you begin" />
          <ul className="mt-5 space-y-3">
            {rules.map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className={panelClass}>
          <PanelHeader icon={History} title="Past attempts" subtitle="Open one to review it" />
          {attempts.length === 0 ? (
            <EmptyState icon={Inbox} title="No attempts yet" text="Your scores and reviews will be listed here." />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {attempts.map((a, i) => (
                <li key={a.id}>
                  <Link
                    to={`/assessments/attempt/${a.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-surface-2/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Attempt {attempts.length - i}</span>
                      <span className="block text-xs text-muted">
                        {timeAgo(a.submittedAt ?? a.createdAt)}
                        {a.timeTakenSec != null && ` · ${formatDuration(a.timeTakenSec)}`}
                        {a.timedOut && ' · time ran out'}
                      </span>
                    </span>
                    {a.gradingStatus === 'pending' ? (
                      <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-500">
                        Grading pending
                      </span>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${scoreClass(a.score ?? 0)}`}>
                        {Math.round(a.score ?? 0)}%
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        tone="danger"
        icon={Trash2}
        title="Delete this assessment?"
        message="This permanently removes the assessment and every attempt and report for it. You cannot undo this."
        confirmLabel="Delete assessment"
        cancelLabel="Keep it"
        busy={deleting}
        error={error}
        onConfirm={remove}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  )
}

export default function AssessmentDetailPage() {
  const { id } = useParams()
  return <DetailView key={id} id={id} />
}