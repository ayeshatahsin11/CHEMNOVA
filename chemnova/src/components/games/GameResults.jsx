import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Check, ChevronDown, Clock, Info, MessageSquare, RotateCcw, Target, Trophy, UserPlus, X,
} from 'lucide-react'
import ProgressRing from '../dashboard/ProgressRing'
import PanelHeader from '../dashboard/PanelHeader'
import { gameMeta, percent } from '../../lib/games'
import { formatDuration, panelClass } from '../../lib/viva'

const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

function ReviewItem({ item, index }) {
  const answered = item.choice !== null && item.choice !== undefined

  return (
    <details className="group rounded-xl border border-border bg-surface-2/40 open:bg-surface-2/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-xs text-muted">Q{index + 1}</span>
        <span className="min-w-0 flex-1 truncate">{item.prompt}</span>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
            item.correct ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
          }`}
        >
          {item.correct ? <Check size={12} /> : <X size={12} />} {item.points}
        </span>
        <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4 text-sm">
        <p className="leading-relaxed font-medium">{item.prompt}</p>

        <ul className="space-y-2">
          {item.options.map((option, i) => {
            const right = i === item.correctIndex
            const wrongPick = answered && i === item.choice && !item.correct

            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  right ? 'border-emerald-500/40 bg-emerald-500/10' : wrongPick ? 'border-red-500/40 bg-red-500/10' : 'border-border'
                }`}
              >
                <span className="flex-1">{option}</span>
                {right && <span className="text-xs text-emerald-500">Correct{answered && item.choice === i ? ' · your answer' : ''}</span>}
                {wrongPick && <span className="text-xs text-red-500">Your answer</span>}
              </li>
            )
          })}
        </ul>

        {!answered && <p className="text-xs text-muted">You did not answer this question.</p>}

        {item.kind === 'mystery' && (
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">Clues</p>
            <ol className="mt-2 space-y-1.5">
              {item.clues.map((clue, i) => (
                <li key={i} className={`flex gap-3 ${i < item.revealed ? '' : 'text-muted'}`}>
                  <span className="font-mono text-xs">{i + 1}.</span>
                  <span>
                    {clue}
                    {i >= item.revealed && <span className="ml-2 text-xs italic">(not needed)</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="leading-relaxed text-muted">{item.explanation}</p>
      </div>
    </details>
  )
}

export default function GameResults({ data, isGuest }) {
  const { round, personalBest, previousBest, review } = data
  const meta = gameMeta[round.game]
  const pct = percent(round.score, round.maxScore)
  const daily = round.game === 'daily'

  const tiles = [
    ['Score', `${round.score} / ${round.maxScore}`],
    ['Correct', `${round.correct} / ${round.total}`],
    ['Time', formatDuration((round.durationMs ?? 0) / 1000)],
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {isGuest && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Guests are not on the leaderboard, and guest scores are deleted after 24 hours.</p>
          <Link to="/register" className="flex shrink-0 items-center gap-1.5 font-medium text-accent hover:underline">
            <UserPlus size={16} /> Create account
          </Link>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-8 md:flex-row">
          <ProgressRing value={pct} size={170} stroke={14} label={String(round.score)} sublabel={`of ${round.maxScore}`} />

          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="font-mono text-xs text-accent">// round complete</p>
            <h2 className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight md:justify-start">
              <meta.icon size={24} className="text-accent" /> {meta.name}
            </h2>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {tiles.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-surface-2/50 p-3">
                  <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>

            {round.game === 'battle' && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted md:justify-start">
                <Clock size={12} /> You answered {round.answered} of {round.total} questions in 60 seconds.
              </p>
            )}
          </div>
        </div>
      </div>

      {personalBest && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-500"
        >
          <Trophy size={20} className="shrink-0" />
          <p>
            <span className="font-semibold">New personal best!</span>{' '}
            {previousBest ? `Your previous best was ${previousBest}.` : 'This is your first scored round.'}
          </p>
        </motion.div>
      )}

      {round.late && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500">
          <Info size={16} className="mt-0.5 shrink-0" />
          Your answers reached us after the time was up, so they did not count.
        </div>
      )}

      <div className={panelClass}>
        <PanelHeader icon={MessageSquare} title="Question review" subtitle="The right answers and why" />
        <div className="mt-5 space-y-3">
          {review.map((item, i) => (
            <ReviewItem key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!daily && (
          <Link to={`/fun-zone/play/${round.game}`} className="btn-glow">
            <RotateCcw size={17} /> Play again
          </Link>
        )}
        <Link to="/fun-zone" className={daily ? 'btn-glow' : 'btn-outline'}>
          <ArrowLeft size={17} /> Back to Fun Zone
        </Link>
        <Link to="/dashboard" className="btn-outline">
          <Target size={17} /> Dashboard
        </Link>
      </div>
    </div>
  )
}