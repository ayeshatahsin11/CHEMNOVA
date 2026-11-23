import { Link } from 'react-router-dom'
import {
  Target, BookOpen, TrendingUp, TrendingDown, MessageSquare, ChevronDown,
  Clock, Info, RotateCcw, LayoutDashboard, UserPlus,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import ProgressRing from '../dashboard/ProgressRing'
import TopicBars from '../dashboard/TopicBars'
import PanelHeader from '../dashboard/PanelHeader'
import ScoreBars from './ScoreBars'
import { formatDuration, modeLabels, panelClass, scoreClass } from '../../lib/viva'

const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

export default function VivaReport({ session, questions }) {
  const { user } = useAuth()
  const r = session.report

  return (
    <div className="space-y-6">
      {user.isGuest && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            Guest sessions are deleted after 24 hours. Create a free account to keep your reports.
          </p>
          <Link to="/register" className="flex shrink-0 items-center gap-1.5 font-medium text-accent hover:underline">
            <UserPlus size={16} /> Create account
          </Link>
        </div>
      )}

      {/* Summary */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-8 md:flex-row">
          <ProgressRing value={r.overall} size={170} stroke={14} label={`${Math.round(r.overall)}%`} sublabel={r.grade} />

          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="font-mono text-xs text-accent">// viva complete</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {session.subject}
              {session.topic && <span className="font-normal text-muted"> · {session.topic}</span>}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className={chip}>
                              {r.answered - r.skipped} of {session.totalQuestions} answered
              </span>
              {r.skipped > 0 && <span className={chip}>{r.skipped} skipped</span>}
              <span className={`${chip} flex items-center gap-1`}>
                <Clock size={12} /> {formatDuration(r.durationSec)}
              </span>
              <span className={chip}>{session.level}</span>
              <span className={chip}>{session.difficulty}</span>
              <span className={chip}>{modeLabels[session.mode] ?? session.mode}</span>
            </div>

            {r.narrativeSource === 'auto' && (
              <p className="mt-4 flex items-start gap-2 text-left text-xs text-muted">
                <Info size={14} className="mt-0.5 shrink-0" />
                The AI was busy, so this written summary was generated automatically from your scores. Your scores
                are not affected.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className={panelClass}>
        <PanelHeader icon={Target} title="Score breakdown" subtitle="Averaged across your answered questions" />
        <div className="mt-6">
          <ScoreBars scores={r} max={100} />
        </div>
      </div>

      {/* Topics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className={panelClass}>
          <PanelHeader icon={TrendingUp} title="Strong topics" subtitle="Scored 70% or more" />
          <div className="mt-5">
            {r.strongTopics.length ? (
              <TopicBars items={r.strongTopics} tone="good" />
            ) : (
              <p className="text-sm text-muted">No topic reached 70% in this exam. Keep practising.</p>
            )}
          </div>
        </div>

        <div className={panelClass}>
          <PanelHeader icon={TrendingDown} title="Needs work" subtitle="Scored below 60%" />
          <div className="mt-5">
            {r.weakTopics.length ? (
              <TopicBars items={r.weakTopics} tone="warn" />
            ) : (
              <p className="text-sm text-muted">No topic fell below 60%. Well done.</p>
            )}
          </div>
        </div>
      </div>

      {/* Improve + revise */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className={panelClass}>
          <PanelHeader icon={Target} title="Where to improve" subtitle="Based on your answers" />
          <ol className="mt-5 space-y-3">
            {r.improvementAreas.map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-xs font-bold text-[#04121c]">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        <div className={panelClass}>
          <PanelHeader icon={BookOpen} title="Recommended revision" subtitle="Topics to study next" />
          <ul className="mt-5 space-y-3">
            {r.revision.map((item, i) => (
              <li key={i} className="rounded-xl border border-border bg-surface-2/50 p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">These are topics to revise, not references or sources.</p>
        </div>
      </div>

      {/* Question review */}
      <div className={panelClass}>
        <PanelHeader icon={MessageSquare} title="Question review" subtitle="Your answers and the examiner's feedback" />
        <div className="mt-5 space-y-3">
          {questions.map((q) => (
            <details key={q.id} className="group rounded-xl border border-border bg-surface-2/40 open:bg-surface-2/60">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs text-muted">Q{q.order}</span>
                <span className="min-w-0 flex-1 truncate">{q.question}</span>
                <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${scoreClass(q.overall)}`}>
                  {Math.round(q.overall)}%
                </span>
                <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 border-t border-border px-4 py-4 text-sm">
                <p className="leading-relaxed">{q.question}</p>
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Your answer</p>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                    {q.skipped ? 'Skipped' : q.answer}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Feedback</p>
                  <p className="mt-1 leading-relaxed">{q.feedback}</p>
                </div>
                {q.misconception && (
                  <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-500">
                    Misconception: {q.misconception}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/viva" className="btn-glow">
          <RotateCcw size={17} /> Start another viva
        </Link>
        <Link to="/dashboard" className="btn-outline">
          <LayoutDashboard size={17} /> Back to dashboard
        </Link>
      </div>
    </div>
  )
}