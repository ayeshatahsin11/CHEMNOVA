import { Link } from 'react-router-dom'
import { ArrowRight, Timer, Trophy } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import { gameMeta, percent } from '../../lib/games'

export default function GameCard({ game }) {
  const meta = gameMeta[game.id]
  const played = game.bestScore !== null && game.bestScore !== undefined
  const pct = played ? percent(game.bestScore, game.maxScore) : 0

  return (
    <Link to={`/fun-zone/play/${game.id}`} className="block h-full rounded-2xl">
      <SpotlightCard className="h-full p-6">
        <div className="flex items-start justify-between">
          <div className="relative h-12 w-12">
            <span
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${meta.gradient} opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-90`}
            />
            <span className={`relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient}`}>
              <meta.icon size={22} className="text-[#04121c]" />
            </span>
          </div>

          {game.durationSec > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-xs text-accent">
              <Timer size={12} /> {game.durationSec}s
            </span>
          )}
        </div>

        <h3 className="mt-5 text-lg font-semibold">{game.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{game.description}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Trophy size={13} /> {played ? `Best ${game.bestScore} / ${game.maxScore}` : 'Not played yet'}
            </span>
            <span>
              {game.plays} {game.plays === 1 ? 'play' : 'plays'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="mt-5 flex items-center gap-1 text-sm font-medium text-accent">
          {played ? 'Play again' : 'Play'}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
        </p>
      </SpotlightCard>
    </Link>
  )
}