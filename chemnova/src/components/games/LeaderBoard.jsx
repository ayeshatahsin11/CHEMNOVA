import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Inbox, AlertCircle, RefreshCw, EyeOff } from 'lucide-react'
import { getLeaderboard } from '../../api/games'
import EmptyState from '../ui/EmptyState'
import PanelHeader from '../dashboard/PanelHeader'
import { panelClass } from '../../lib/viva'

const medal = ['bg-amber-400/20 text-amber-500', 'bg-slate-400/20 text-slate-400', 'bg-orange-500/20 text-orange-500']

function Row({ rank, name, score, isMe }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isMe ? 'border border-accent/40 bg-accent/10' : ''}`}>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-sm font-bold ${
          medal[rank - 1] ?? 'bg-surface-2 text-muted'
        }`}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {name}
        {isMe && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">You</span>}
      </span>
      <span className="font-mono text-sm font-semibold">{score}</span>
    </li>
  )
}

export default function Leaderboard({ games, isGuest }) {
  const [game, setGame] = useState(games[0].id)
  const [period, setPeriod] = useState('week')
  const [reload, setReload] = useState(0)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    getLeaderboard(game, period).then(
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
  }, [game, period, reload])

  const toggle = (value, label) => (
    <button
      type="button"
      role="radio"
      aria-checked={period === value}
      onClick={() => setPeriod(value)}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        period === value
          ? 'border-accent bg-accent/15 font-medium text-content'
          : 'border-border bg-surface-2/50 text-muted hover:text-content'
      }`}
    >
      {label}
    </button>
  )

  const data = state.data

  return (
    <div className={panelClass}>
      <PanelHeader
        icon={Trophy}
        title="Leaderboard"
        subtitle="Each player's best round"
        right={
          <div role="radiogroup" aria-label="Time period" className="flex gap-2">
            {toggle('week', 'This week')}
            {toggle('all', 'All time')}
          </div>
        }
      />

      <label className="mt-5 flex items-center gap-3 text-xs text-muted">
        Game
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus:border-accent"
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      {data && data.eligible === false && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-muted">
            <EyeOff size={16} className="mt-0.5 shrink-0" />
            {isGuest
              ? 'Guests are not on the leaderboard. Create a free account to compete.'
              : 'You are currently hidden from the leaderboard.'}
          </p>
          {isGuest && (
            <Link to="/register" className="shrink-0 font-medium text-accent hover:underline">
              Create account
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 min-h-40">
        {state.status === 'loading' && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading leaderboard">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-2/60" />
            ))}
          </div>
        )}

        {state.status === 'error' && (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertCircle size={22} />
            </span>
            <p className="mt-3 text-sm text-muted">{state.message}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className="btn-outline mt-4 text-sm">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {state.status === 'ready' && data.entries.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={period === 'week' ? 'No scores this week yet' : 'No scores yet'}
            text="Play a round and you could be the first on the board."
          />
        )}

        {state.status === 'ready' && data.entries.length > 0 && (
          <ol className="space-y-1">
            {data.entries.map((e) => (
              <Row key={`${e.rank}-${e.name}-${e.score}-${e.isMe}`} {...e} />
            ))}

            {data.me && (
              <>
                <li aria-hidden className="py-1 text-center text-xs text-muted">
                  ...
                </li>
                <Row rank={data.me.rank} name="You" score={data.me.score} isMe />
              </>
            )}
          </ol>
        )}
      </div>
    </div>
  )
}