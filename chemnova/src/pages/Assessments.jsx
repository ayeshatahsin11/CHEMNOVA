import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight, Tag, AlertCircle, RefreshCw, UserPlus, Clock, Wand2 } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { getAssessmentOptions, listAssessments, createAssessment, deleteAssessment } from '../api/assessments'
import { typeMeta, typeOrder, planSummary, suggestMinutes } from '../lib/assessment'
import { panelClass } from '../lib/viva'
import Reveal from '../components/ui/Reveal'
import SpotlightCard from '../components/ui/SpotlightCard'
import FormField from '../components/auth/FormField'
import FormAlert from '../components/auth/FormAlert'
import ChoiceCard from '../components/viva/ChoiceCard'
import AssessmentHistory from '../components/assessment/AssessmentHistory'

const levelHints = {
  School: 'Up to grade 12',
  Undergraduate: "Bachelor's",
  Postgraduate: "Master's / PhD",
  Research: 'Professional',
}

function Section({ id, label, hint, radio = false, children }) {
  return (
    <div role={radio ? 'radiogroup' : 'group'} aria-labelledby={id}>
      <p id={id} className="mb-2 text-sm font-medium">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-muted">{hint}</span>}
      </p>
      {children}
    </div>
  )
}

function SetupForm({ options, user }) {
  const navigate = useNavigate()
  const { limits } = options

  const [form, setForm] = useState({
    subject: options.subjects[0],
    topic: '',
    level: options.levels.includes(user.level) ? user.level : options.levels[0],
    difficulty: options.difficulties.includes('Intermediate') ? 'Intermediate' : options.difficulties[0],
    types: ['mcq', 'true_false', 'numerical', 'conceptual'].filter((t) => options.types.some((o) => o.id === t)),
    totalQuestions: limits.defaultQuestions,
    timed: false,
    minutes: null, // null means "follow the suggestion"
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  const plan = planSummary(options.types, form.types, form.totalQuestions)
  const suggested = suggestMinutes(plan.minutes, limits)
  const minutes = form.minutes ?? suggested

  const toggleType = (id) => {
    const selected = form.types.includes(id)
    if (selected && form.types.length === 1) return // at least one type is required
    set('types', selected ? form.types.filter((t) => t !== id) : [...form.types, id])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')
    try {
      const res = await createAssessment({
        subject: form.subject,
        topic: form.topic.trim(),
        level: form.level,
        difficulty: form.difficulty,
        types: form.types,
        totalQuestions: form.totalQuestions,
        durationMinutes: form.timed ? minutes : 0,
      })
      navigate(`/assessments/${res.assessment.id}`, {
        state:
          res.generated < res.requested
            ? { notice: `Generated ${res.generated} of ${res.requested} questions. Some did not pass our accuracy checks.` }
            : undefined,
      })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`${panelClass} space-y-7`}>
      {options.guest && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            Guest mode: up to {options.guest.assessments} tests of {limits.maxQuestions} questions, not saved.
          </p>
          <Link to="/register" className="flex shrink-0 items-center gap-1.5 font-medium text-accent hover:underline">
            <UserPlus size={15} /> Create account
          </Link>
        </div>
      )}

      <Section id="subject-label" label="Subject" radio>
        <div className="flex flex-wrap gap-2">
          {options.subjects.map((s) => {
            const active = form.subject === s
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set('subject', s)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? 'border-accent bg-accent/15 font-medium text-content'
                    : 'border-border bg-surface-2/50 text-muted hover:border-accent/50 hover:text-content'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </Section>

      <FormField
        id="topic"
        label="Topic or chapter (optional)"
        icon={Tag}
        placeholder="e.g. Acids, bases and pH"
        maxLength={limits.maxTopicChars}
        value={form.topic}
        onChange={(e) => set('topic', e.target.value)}
      />

      <Section id="level-label" label="Academic level" radio>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.levels.map((l) => {
            const active = form.level === l
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set('level', l)}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-accent bg-accent/10 ring-4 ring-accent/10'
                    : 'border-border bg-surface-2/50 hover:border-accent/50'
                }`}
              >
                <span className="block text-sm font-medium">{l}</span>
                <span className="block text-xs text-muted">{levelHints[l]}</span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section id="difficulty-label" label="Difficulty" radio>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.difficulties.map((d) => {
            const active = form.difficulty === d
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set('difficulty', d)}
                className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                  active
                    ? 'border-accent bg-accent/10 font-medium ring-4 ring-accent/10'
                    : 'border-border bg-surface-2/50 text-muted hover:border-accent/50 hover:text-content'
                }`}
              >
                {d}
              </button>
            )
          })}
        </div>
      </Section>

      <Section id="types-label" label="Question types" hint="Pick one or more">
        <div className="grid gap-3 sm:grid-cols-2">
          {typeOrder.map((id) => {
            const info = options.types.find((t) => t.id === id)
            if (!info) return null
            return (
              <ChoiceCard
                key={id}
                multi
                active={form.types.includes(id)}
                onClick={() => toggleType(id)}
                icon={typeMeta[id].icon}
                title={typeMeta[id].label}
                description={`${info.marks} ${info.marks === 1 ? 'mark' : 'marks'} · ${
                  info.aiGraded ? 'graded by AI' : 'graded instantly'
                }`}
              />
            )
          })}
        </div>
      </Section>

      <Section id="count-label" label="Number of questions">
        <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {limits.minQuestions} to {limits.maxQuestions}
            </span>
            <span className="font-mono text-lg font-semibold text-accent">{form.totalQuestions}</span>
          </div>
          <input
            type="range"
            aria-labelledby="count-label"
            min={limits.minQuestions}
            max={limits.maxQuestions}
            value={form.totalQuestions}
            onChange={(e) => set('totalQuestions', Number(e.target.value))}
            className="mt-3 w-full accent-accent"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
            <span className="text-muted">
              {plan.marks} marks in total:
            </span>
            {typeOrder
              .filter((t) => plan.counts[t])
              .map((t) => (
                <span key={t} className="rounded-full border border-border bg-surface px-2.5 py-0.5">
                  {plan.counts[t]} {typeMeta[t].short}
                </span>
              ))}
          </div>
        </div>
      </Section>

      <Section id="time-label" label="Time limit" radio>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            active={!form.timed}
            onClick={() => set('timed', false)}
            icon={Clock}
            title="Untimed"
            description="Take as long as you need."
          />
          <ChoiceCard
            active={form.timed}
            onClick={() => set('timed', true)}
            icon={Clock}
            title="Timed"
            description="A countdown runs, and your answers are submitted automatically at zero."
          />
        </div>

        {form.timed && (
          <div className="mt-3 rounded-xl border border-border bg-surface-2/50 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {limits.minDuration} to {limits.maxDuration} minutes
              </span>
              <span className="font-mono text-lg font-semibold text-accent">{minutes} min</span>
            </div>
            <input
              type="range"
              aria-label="Time limit in minutes"
              min={limits.minDuration}
              max={limits.maxDuration}
              step={5}
              value={minutes}
              onChange={(e) => set('minutes', Number(e.target.value))}
              className="mt-3 w-full accent-accent"
            />
            {minutes !== suggested && (
              <button
                type="button"
                onClick={() => set('minutes', null)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                <Wand2 size={13} /> Use the suggested {suggested} min for this test
              </button>
            )}
          </div>
        )}
      </Section>

      <div>
        <FormAlert message={error} />

        <button
          type="submit"
          disabled={busy}
          className="btn-glow w-full justify-center disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Writing your questions...
            </>
          ) : (
            <>
              Generate assessment <ArrowRight size={18} />
            </>
          )}
        </button>

        {busy && (
          <p role="status" className="mt-3 text-center text-xs text-muted">
            The AI is writing and checking your questions. This can take up to a minute or two on free tiers.
          </p>
        )}
      </div>
    </form>
  )
}

const block = 'animate-pulse rounded-2xl bg-surface-2/60'

export default function Assessments() {
  const { user } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    Promise.all([getAssessmentOptions(), listAssessments()]).then(
      ([options, assessments]) => {
        if (!cancelled) setState({ status: 'ready', options, assessments })
      },
      (err) => {
        if (!cancelled) setState({ status: 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }

  const removeAssessment = async (id) => {
    await deleteAssessment(id)
    setState((s) => ({ ...s, assessments: s.assessments.filter((x) => x.id !== id) }))
  }

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading">
        <div className={`${block} h-32`} />
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className={`${block} h-[48rem]`} />
          <div className={`${block} h-72`} />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">We could not load the Assessment Studio</h2>
          <p className="mt-1 text-sm text-muted">{state.message}</p>
          <button onClick={retry} className="btn-glow mt-6">
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-xs text-accent">// new assessment</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Build a test that fits <span className="text-gradient">your level</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Choose the topic, question types and time limit. Numerical answers are checked by code, and you get a
              full report with explanations at the end.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <Reveal delay={0.05}>
          <SetupForm options={state.options} user={user} />
        </Reveal>
        <Reveal delay={0.1}>
          <AssessmentHistory assessments={state.assessments} isGuest={user.isGuest} onDelete={removeAssessment} />
        </Reveal>
      </div>
    </div>
  )
}

