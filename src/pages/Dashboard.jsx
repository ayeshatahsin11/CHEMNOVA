import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic, ClipboardCheck, FlaskConical, Flame, Eye, EyeOff, AlertCircle, RefreshCw, UserPlus,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { fetchDashboard, buildSampleDashboard } from '../api/dashboard'
import { getGreeting } from '../lib/format'
import { roleLabel } from '../lib/user'
import Reveal from '../components/ui/Reveal'
import SpotlightCard from '../components/ui/SpotlightCard'
import StatCard from '../components/dashboard/StatCard'
import ActivityChart from '../components/dashboard/ActivityChart'
import MasteryPanel from '../components/dashboard/MasteryPanel'
import SubjectRadar from '../components/dashboard/SubjectRadar'
import TopicsPanel from '../components/dashboard/TopicsPanel'
import RecentActivity from '../components/dashboard/RecentActivity'
import Recommendations from '../components/dashboard/Recommendations'
import Achievements from '../components/dashboard/Achievements'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'

const statCards = [
  {
    key: 'vivas', label: 'Viva sessions', icon: Mic, gradient: 'from-cyan-400 to-blue-500',
    hint: 'sessions completed', emptyText: 'Take your first viva',
  },
  {
    key: 'assessments', label: 'Assessments', icon: ClipboardCheck, gradient: 'from-violet-400 to-fuchsia-500',
    hint: 'tests taken', emptyText: 'Build your first test',
  },
  {
    key: 'research', label: 'Research projects', icon: FlaskConical, gradient: 'from-emerald-400 to-cyan-500',
    hint: 'active workspaces', emptyText: 'Start a research project',
  },
  {
    key: 'streak', label: 'Day streak', icon: Flame, gradient: 'from-amber-400 to-pink-500',
    hint: 'days in a row', emptyText: 'Study today to begin',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [greeting] = useState(() => getGreeting())
  const [sample, setSample] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', data: null })
  const sampleData = useMemo(() => buildSampleDashboard(), [])

  useEffect(() => {
    let cancelled = false
    fetchDashboard().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      () => {
        if (!cancelled) setState({ status: 'error', data: null })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading', data: null })
    setAttempt((a) => a + 1)
  }

  if (state.status === 'loading') return <DashboardSkeleton />

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-lg">
        <SpotlightCard className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">We could not load your dashboard</h2>
          <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
          <button onClick={retry} className="btn-glow mt-6">
            <RefreshCw size={17} /> Try again
          </button>
        </SpotlightCard>
      </div>
    )
  }

  const data = sample ? sampleData : state.data
  const firstName = user.name.split(' ')[0]
  const hasData = data.stats.vivas + data.stats.assessments > 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-violet-500/25 to-pink-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs text-accent">// {greeting.toLowerCase()}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting}, <span className="text-gradient">{firstName}</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {hasData
                  ? 'Here is how your chemistry is going. Pick up where you left off.'
                  : 'Your dashboard fills up as you study. Start with a viva or a quick test.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs">
                  {user.level}
                </span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSample((s) => !s)}
              className="btn-outline shrink-0 self-start text-sm sm:self-center"
            >
              {sample ? (
                <>
                  <EyeOff size={16} /> Hide sample data
                </>
              ) : (
                <>
                  <Eye size={16} /> Preview with sample data
                </>
              )}
            </button>
          </div>
        </div>
      </Reveal>

      {sample && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-500"
        >
          <Eye size={17} className="shrink-0" />
          Sample data is on. These numbers are for previewing the design and are not your real progress.
        </div>
      )}

      {user.isGuest && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            You are in guest mode, so your activity is not saved. Create a free account to track progress.
          </p>
          <Link to="/register" className="flex shrink-0 items-center gap-1.5 font-medium text-accent hover:underline">
            <UserPlus size={16} /> Create account
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s, i) => (
          <Reveal key={s.key} delay={0.05 + i * 0.06}>
            <StatCard
              icon={s.icon}
              label={s.label}
              value={data.stats[s.key]}
              hint={s.hint}
              emptyText={s.emptyText}
              gradient={s.gradient}
            />
          </Reveal>
        ))}
      </div>

      {/* Activity + mastery */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <ActivityChart data={data.activity} />
        </Reveal>
        <Reveal delay={0.15}>
          <MasteryPanel mastery={data.mastery} subjectCount={data.subjects.length} level={user.level} />
        </Reveal>
      </div>

      {/* Subjects + topics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.1}>
          <SubjectRadar subjects={data.subjects} />
        </Reveal>
        <Reveal delay={0.15}>
          <TopicsPanel strong={data.strong} weak={data.weak} />
        </Reveal>
      </div>

      {/* Recent + recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <RecentActivity items={data.recent} />
        </Reveal>
        <Reveal delay={0.15}>
          <Recommendations items={data.recommendations} personalised={hasData} />
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Achievements earned={data.earned} />
      </Reveal>
    </div>
  )
}