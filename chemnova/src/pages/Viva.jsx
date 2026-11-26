import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, Loader2, ArrowRight, Keyboard, Mic, Tag, AlertCircle, RefreshCw, UserPlus,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { getVivaOptions, listVivaSessions, createVivaSession, deleteVivaSession } from '../api/viva'
import { modeIcons, panelClass } from '../lib/viva'
import Reveal from '../components/ui/Reveal'
import SpotlightCard from '../components/ui/SpotlightCard'
import FormField from '../components/auth/FormField'
import FormAlert from '../components/auth/FormAlert'
import ChoiceCard from '../components/viva/ChoiceCard'
import SessionHistory from '../components/viva/SessionHistory'
import { canRecognize } from '../lib/speech'

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
  const voiceSupported = canRecognize()
  const [form, setForm] = useState({
    subject: options.subjects[0],
    topic: '',
    level: options.levels.includes(user.level) ? user.level : options.levels[0],
    difficulty: options.difficulties.includes('Intermediate') ? 'Intermediate' : options.difficulties[0],
    mode: options.modes[0].id,
    totalQuestions: limits.defaultQuestions,
    inputMode: 'text',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')
    try {
      const { session } = await createVivaSession({ ...form, topic: form.topic.trim() })
      navigate(`/viva/${session.id}`)
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
            Guest mode: {options.guest.sessions} viva session, up to {limits.maxQuestions} questions, not saved.
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
        placeholder="e.g. SN1 and SN2 reactions"
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

      <Section id="mode-label" label="Exam style" radio>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.modes.map((m) => (
            <ChoiceCard
              key={m.id}
              active={form.mode === m.id}
              onClick={() => set('mode', m.id)}
              icon={modeIcons[m.id] ?? Sparkles}
              title={m.label}
              description={m.description}
            />
          ))}
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
        </div>
      </Section>

      <Section id="input-label" label="How do you want to answer?" radio>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            active={form.inputMode === 'text'}
            onClick={() => set('inputMode', 'text')}
            icon={Keyboard}
            title="Type"
            description="Write your answers."
          />
                  <ChoiceCard
            active={form.inputMode === 'voice'}
            onClick={() => set('inputMode', 'voice')}
            disabled={!voiceSupported}
            icon={Mic}
            title="Speak"
            badge={voiceSupported ? undefined : 'Not supported in this browser'}
            description="Hear the examiner and answer out loud. You can edit what was heard before you send it."
          />
        </div>
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
              <Loader2 size={18} className="animate-spin" /> Preparing your examiner...
            </>
          ) : (
            <>
              Start viva <ArrowRight size={18} />
            </>
          )}
        </button>

        {busy && (
          <p role="status" className="mt-3 text-center text-xs text-muted">
            Writing your first question. This can take up to a minute on free AI tiers.
          </p>
        )}
      </div>
    </form>
  )
}

const block = 'animate-pulse rounded-2xl bg-surface-2/60'

export default function Viva() {
  const { user } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    Promise.all([getVivaOptions(), listVivaSessions()]).then(
      ([options, sessions]) => {
        if (!cancelled) setState({ status: 'ready', options, sessions })
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

  const removeSession = async (id) => {
    await deleteVivaSession(id)
    setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }))
  }

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading">
        <div className={`${block} h-32`} />
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className={`${block} h-[40rem]`} />
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
          <h2 className="mt-4 text-lg font-semibold">We could not load the viva setup</h2>
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
            <p className="font-mono text-xs text-accent">// new viva</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Face the <span className="text-gradient">examiner</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              One question at a time. Every answer is scored and shapes the next question, and you get a full report
              at the end.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <Reveal delay={0.05}>
          <SetupForm options={state.options} user={user} />
        </Reveal>
        <Reveal delay={0.1}>
          <SessionHistory sessions={state.sessions} isGuest={user.isGuest} onDelete={removeSession} />
        </Reveal>
      </div>
    </div>
  )
}