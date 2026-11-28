import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import { gameMeta } from '../../lib/games'

export default function DailyCard({ daily }) {
  const meta = gameMeta.daily
  const to = daily.state === 'new' ? '/fun-zone/play/daily' : `/fun-zone/round/${daily.roundId}`
  const date = new Date(`${daily.dayKey}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const text = {
    new: 'Five mixed questions, the same for everyone today. You get one attempt, so make it count.',
    active: "You have started today's challenge. Pick it up where you left off.",
    finished: `You scored ${daily.score} of ${daily.maxScore} (${daily.correct} of ${daily.total} correct). Come back tomorrow to keep your streak going.`,
  }[daily.state]

  const label = { new: "Play today's challenge", active: 'Resume the challenge', finished: 'View your results' }[daily.state]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-amber-400/25 via-pink-500/25 to-violet-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient}`}>
            <meta.icon size={26} className="text-[#04121c]" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs text-accent">// {date}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{meta.name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{text}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl ${
                daily.streak > 0 ? 'bg-amber-400/15 text-amber-500' : 'bg-surface-2 text-muted'
              }`}
            >
              <Flame size={22} />
            </span>
            <div>
              <p className="text-lg leading-tight font-bold">
                {daily.streak}-day streak
              </p>
              <p className="text-xs text-muted">Best: {daily.bestStreak} {daily.bestStreak === 1 ? 'day' : 'days'}</p>
            </div>
          </div>

          <Link to={to} className="btn-glow">
            {label} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}