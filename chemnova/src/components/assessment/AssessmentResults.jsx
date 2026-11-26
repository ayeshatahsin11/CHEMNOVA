import { Link } from 'react-router-dom'
import {
  Loader2, RotateCcw, LayoutDashboard, ArrowLeft, Clock, Info, UserPlus,
  Target, BookOpen, TrendingUp, TrendingDown, MessageSquare, RefreshCw,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import ProgressRing from '../dashboard/ProgressRing'
import TopicBars from '../dashboard/TopicBars'
import PanelHeader from '../dashboard/PanelHeader'
import FormAlert from '../auth/FormAlert'
import TypeBreakdownChart from './TypeBreakdownChart'
import ReviewQuestion from './ReviewQuestion'
import { formatMarks, plural } from '../../lib/assessment'
import { formatDuration, panelClass } from '../../lib/viva'

const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

export default function AssessmentResults({ data, onRegrade, regrading, onRetake, retaking, error }) {
  const { user } = useAuth()
  const { attempt, assessment, questions, report } = data

  const tiles = [
    ['Correct', report.correct, 'bg-emerald-500'],
    ['Partly right', report.partial, 'bg-amber-400'],
    ['Incorrect', report.incorrect, 'bg-red-500'],
    ['Not answered', report.unanswered, 'bg-muted'],
  ]

  return (
    <div className="space-y-6">
      {user.isGuest && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            Guest results are deleted after 24 hours. Create a free account to keep your history.
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
          <ProgressRing
            value={report.score}
            size={170}
            stroke={14}
            label={`${Math.round(report.score)}%`}
            sublabel={report.pendingCount > 0 ? 'so far' : report.grade}
          />

          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="font-mono text-xs text-accent">// assessment complete</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{assessment.title}</h2>
            <p className="mt-2 text-sm text-muted">
              {formatMarks(report.earnedMarks)} of {report.totalMarks} marks
              {report.pendingCount > 0 && ' (graded so far)'}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className={chip}>{assessment.level}</span>
              <span className={chip}>{assessment.difficulty}</span>
              <span className={`${chip} flex items-center gap-1`}>
                <Clock size={12} /> {formatDuration(report.timeTakenSec)}
                {report.durationMinutes > 0 && ` of ${report.durationMinutes}m`}
              </span>
              {report.timedOut && (
                <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-500">Time ran out</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {report.pendingCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            {plural(report.pendingCount, 'written answer')} {report.pendingCount === 1 ? 'is' : 'are'} still waiting
            for AI grading, so the score does not include {report.pendingCount === 1 ? 'it' : 'them'} yet.
          </p>
          <button
            type="button"
            onClick={onRegrade}
            disabled={regrading}
            className="btn-outline shrink-0 text-sm disabled:pointer-events-none disabled:opacity-60"
          >
            {regrading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Grading...
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Grade now
              </>
            )}
          </button>
        </div>
      )}

      <FormAlert message={error} />

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(([name, value, dot]) => (
          <div key={name} className="rounded-2xl border border-border bg-surface/60 p-4 backdrop-blur-md">
            <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">
              <span className={`h-2 w-2 rounded-full ${dot}`} /> {name}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts and topics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TypeBreakdownChart byType={report.byType} />

        <div className={panelClass}>
          <PanelHeader icon={Target} title="Topics" subtitle="How you did on each topic" />
          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-emerald-500 uppercase">
                <TrendingUp size={14} /> Strong (70% or more)
              </p>
              {report.strongTopics.length ? (
                <TopicBars items={report.strongTopics} tone="good" />
              ) : (
                <p className="text-sm text-muted">No topic reached 70% this time.</p>
              )}
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-amber-500 uppercase">
                <TrendingDown size={14} /> Needs work (below 60%)
              </p>
              {report.weakTopics.length ? (
                <TopicBars items={report.weakTopics} tone="warn" />
              ) : (
                <p className="text-sm text-muted">No topic fell below 60%. Well done.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision */}
      {report.revision.length > 0 && (
        <div className={panelClass}>
          <PanelHeader icon={BookOpen} title="Recommended revision" subtitle="Topics to study next" />
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {report.revision.map((item) => (
              <li key={item.title} className="rounded-xl border border-border bg-surface-2/50 p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">{item.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">These are topics to revise, not references or sources.</p>
        </div>
      )}

      {/* Review */}
      <div className={panelClass}>
        <PanelHeader icon={MessageSquare} title="Question review" subtitle="Your answers, the correct answers and explanations" />
        <div className="mt-5 space-y-3">
          {questions.map((q, i) => (
            <ReviewQuestion key={q.id} q={q} index={i} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Questions are written by AI and can contain mistakes. If something looks wrong, check it against your
          textbook or ask your teacher.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetake}
          disabled={retaking}
          className="btn-glow disabled:pointer-events-none disabled:opacity-60"
        >
          {retaking ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Starting...
            </>
          ) : (
            <>
              <RotateCcw size={17} /> Retake this test
            </>
          )}
        </button>
        <Link to="/assessments" className="btn-outline">
          <ArrowLeft size={17} /> Assessment Studio
        </Link>
        <Link to="/dashboard" className="btn-outline">
          <LayoutDashboard size={17} /> Dashboard
        </Link>
      </div>
    </div>
  )
}