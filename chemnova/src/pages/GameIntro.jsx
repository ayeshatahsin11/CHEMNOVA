import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, ArrowRight, Loader2, Play, RefreshCw, SearchX, ShieldCheck, Timer, Trophy,
} from 'lucide-react'
import { getOverview, startRound } from '../api/games'
import { gameMeta } from '../lib/games'
import { panelClass } from '../lib/viva'
import SpotlightCard from '../components/ui/SpotlightCard'
import FormAlert from '../components/auth/FormAlert'
import PanelHeader from '../components/dashboard/PanelHeader'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'
const chip = 'rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs'

function IntroView({ gameId }) {
  const meta = gameMeta[gameId]
  const navigate = useNavigate()
  const [reload, setReload] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [data, setData] = useState(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!meta) return
    let cancelled = false

    getOverview().then(
      (res) => {
        if (cancelled) return
        setData(res)
        setLoad({ status: 'ready', message: '' })
      },
      (err) => {
        if (!cancelled) setLoad({ status: 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [gameId, meta, reload])

  if (!meta) {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
            <SearchX size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Game not found</h2>
          <p className="mt-1 text-sm text-muted">We do not have a game with that name.</p>
          <Link to="/fun-zone" className="btn-glow mt-6">
            <ArrowLeft size={17} /> Back to Fun Zone
          </Link>
        </SpotlightCard>
      </div>
    )
  }

  if (load.status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading">
        <div className={`${block} h-48`} />
        <div className={`${block} h-56`} />
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
          <h2 className="mt-4 text-lg font-semibold">We could not load this game</h2>
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

  const game = data.games.find((g) => g.id === gameId)
  const dailyState = gameId === 'daily' ? data.daily.state : 'new'
  const played = game.bestScore !== null && game.bestScore !== undefined

  const start = async () => {
    setStarting(true)
    setError('')
    try {
      const res = await startRound(gameId)
      navigate(`/fun-zone/round/${res.round.id}`, { replace: true })
    } catch (err) {
      // The daily challenge may already be finished or under way, in which case the server names today's round
      if (err.status === 409 && err.data?.roundId) {
        navigate(`/fun-zone/round/${err.data.roundId}`, { replace: true })
        return
      }
      setError(err.message)
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient}`}>
            <meta.icon size={30} className="text-[#04121c]" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs text-accent">// ready to play</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{meta.name}</h2>
            <p className="mt-2 text-sm text-muted">{game.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={chip}>{game.questions} questions</span>
              {game.durationSec > 0 && (
                <span className={`${chip} flex items-center gap-1 text-accent`}>
                  <Timer size={12} /> {game.durationSec} seconds
                </span>
              )}
              <span className={chip}>Up to {game.maxScore} points</span>
              {played && (
                <span className={`${chip} flex items-center gap-1`}>
                  <Trophy size={12} /> Best {game.bestScore}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={panelClass}>
        <PanelHeader icon={ShieldCheck} title="How it works" subtitle="Read this first" />
        <ul className="mt-5 space-y-3">
          {meta.rules.map((rule) => (
            <li key={rule} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <FormAlert message={error} />

      <div className="flex flex-wrap gap-3">
        {dailyState === 'new' ? (
          <button type="button" onClick={start} disabled={starting} className="btn-glow disabled:pointer-events-none disabled:opacity-60">
            {starting ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Getting ready...
              </>
            ) : (
              <>
                <Play size={17} /> {gameId === 'battle' ? 'Start the 60 seconds' : 'Start'} <ArrowRight size={17} />
              </>
            )}
          </button>
        ) : (
          <Link to={`/fun-zone/round/${data.daily.roundId}`} className="btn-glow">
            {dailyState === 'active' ? 'Resume the challenge' : 'View your results'} <ArrowRight size={17} />
          </Link>
        )}
        <Link to="/fun-zone" className="btn-outline">
          <ArrowLeft size={17} /> Back
        </Link>
      </div>
    </div>
  )
}

export default function GameIntroPage() {
  const { game } = useParams()
  return <IntroView key={game} gameId={game} />
}