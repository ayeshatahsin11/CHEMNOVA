import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, RefreshCw, SearchX } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { getRound, submitRound } from '../api/games'
import SpotlightCard from '../components/ui/SpotlightCard'
import BattlePlay from '../components/games/BattlePlay'
import ClassicPlay from '../components/games/ClassicPlay'
import GameResults from '../components/games/GameResults'

const block = 'animate-pulse rounded-2xl bg-surface-2/60'
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function RoundView({ id }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reload, setReload] = useState(0)
  const [load, setLoad] = useState({ status: 'loading', message: '' })
  const [data, setData] = useState(null)
  const [result, setResult] = useState(null) // set once a round has been scored
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    getRound(id).then(
      (res) => {
        if (cancelled) return
        setData(res)
        setError('')
        setLoad({ status: 'ready', message: '' })
      },
      (err) => {
        if (cancelled) return
        const missing = err.status === 404 || err.status === 400
        setLoad({ status: missing ? 'missing' : 'error', message: err.message })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id, reload])

  const refresh = () => {
    setLoad({ status: 'loading', message: '' })
    setReload((n) => n + 1)
  }

  if (load.status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading">
        <div className={`${block} h-24`} />
        <div className={`${block} h-3`} />
        <div className={`${block} h-96`} />
      </div>
    )
  }

  if (load.status === 'missing') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
            <SearchX size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Round not found</h2>
          <p className="mt-1 text-sm text-muted">It may have expired, or it belongs to another account.</p>
          <Link to="/fun-zone" className="btn-glow mt-6">
            <ArrowLeft size={17} /> Back to Fun Zone
          </Link>
        </SpotlightCard>
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
          <h2 className="mt-4 text-lg font-semibold">We could not load this round</h2>
          <p className="mt-1 text-sm text-muted">{load.message}</p>
          <button onClick={refresh} className="btn-glow mt-6">
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  // A finished round (opened from a link or after a reload) comes back with its review
  const finished = result ?? (data.review ? data : null)
  if (finished) return <GameResults data={finished} isGuest={user.isGuest} />

  const submitBattle = async (answers) => {
    setSubmitting(true)
    setError('')
    try {
      setResult(await submitRound(id, answers))
      toTop()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const done = (res) => {
    setResult(res)
    toTop()
  }

  if (data.round.game === 'battle') {
    return (
      <BattlePlay
        round={data.round}
        questions={data.questions}
        onFinish={submitBattle}
        submitting={submitting}
        error={error}
        onExit={() => navigate('/fun-zone')}
      />
    )
  }

  return (
    <ClassicPlay
      round={data.round}
      initialQuestions={data.questions}
      initialProgress={data.progress}
      onDone={done}
      onExit={() => navigate('/fun-zone')}
      onReload={refresh}
    />
  )
}

export default function GameRoundPage() {
  const { id } = useParams()
  return <RoundView key={id} id={id} />
}