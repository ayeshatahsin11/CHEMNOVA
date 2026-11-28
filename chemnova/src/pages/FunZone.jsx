import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, RefreshCw, UserPlus } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { getOverview } from '../api/games'
import { hubGames } from '../lib/games'
import Reveal from '../components/ui/Reveal'
import SpotlightCard from '../components/ui/SpotlightCard'
import DailyCard from '../components/games/DailyCard'
import GameCard from '../components/games/GameCard'
import Leaderboard from '../components/games/LeaderBoard'


const block = 'animate-pulse rounded-2xl bg-surface-2/60'

export default function FunZone() {
  const { user } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getOverview().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      (err) => {
        if (!cancelled) setState({ status: 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading">
        <div className={`${block} h-32`} />
        <div className={`${block} h-44`} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-64`} />
          ))}
        </div>
        <div className={`${block} h-96`} />
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
          <h2 className="mt-4 text-lg font-semibold">We could not load the Fun Zone</h2>
          <p className="mt-1 text-sm text-muted">{state.message}</p>
          <button
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((a) => a + 1)
            }}
            className="btn-glow mt-6"
          >
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  const { games, daily } = state.data
  const cards = hubGames.map((id) => games.find((g) => g.id === id)).filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-xs text-accent">// fun zone</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Learn chemistry by <span className="text-gradient">playing</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Quick games on elements, trends and molecules. Every answer comes with an explanation, so you learn
              even when you miss.
            </p>
          </div>
        </div>
      </Reveal>

      {user.isGuest && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            You can play everything as a guest, but guest scores are not saved on the leaderboard.
          </p>
          <Link to="/register" className="flex shrink-0 items-center gap-1.5 font-medium text-accent hover:underline">
            <UserPlus size={16} /> Create account
          </Link>
        </div>
      )}

      <Reveal delay={0.05}>
        <DailyCard daily={daily} />
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((game, i) => (
          <Reveal key={game.id} delay={0.08 + i * 0.06}>
            <GameCard game={game} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Leaderboard games={games} isGuest={user.isGuest} />
      </Reveal>
    </div>
  )
}