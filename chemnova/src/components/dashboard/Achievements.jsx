import { Trophy, Lock, Mic, ClipboardCheck, Flame, Target, FlaskConical, Gamepad2 } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import PanelHeader from './PanelHeader'

const badges = [
  { id: 'first-viva', icon: Mic, title: 'First Viva', desc: 'Complete a viva session', gradient: 'from-cyan-400 to-blue-500' },
  { id: 'first-test', icon: ClipboardCheck, title: 'Test Taker', desc: 'Finish an assessment', gradient: 'from-violet-400 to-fuchsia-500' },
  { id: 'streak-3', icon: Flame, title: 'On a Roll', desc: 'Study 3 days in a row', gradient: 'from-amber-400 to-pink-500' },
  { id: 'sharp', icon: Target, title: 'Sharp Mind', desc: 'Score 90% or more', gradient: 'from-emerald-400 to-cyan-500' },
  { id: 'researcher', icon: FlaskConical, title: 'Researcher', desc: 'Start a research project', gradient: 'from-sky-400 to-indigo-500' },
  { id: 'player', icon: Gamepad2, title: 'Game On', desc: 'Play a Fun Zone game', gradient: 'from-pink-400 to-violet-500' },
]

export default function Achievements({ earned }) {
  const count = badges.filter((b) => earned.includes(b.id)).length

  return (
    <SpotlightCard className="p-6">
      <PanelHeader
        icon={Trophy}
        title="Achievements"
        subtitle={`${count} of ${badges.length} unlocked`}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {badges.map((b) => {
          const unlocked = earned.includes(b.id)
          return (
            <div
              key={b.id}
              className={`flex flex-col items-center rounded-xl border p-4 text-center transition duration-300 hover:-translate-y-1 ${
                unlocked ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface-2/40'
              }`}
            >
              <div className="relative h-12 w-12">
                {unlocked && (
                  <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${b.gradient} opacity-60 blur-lg`} />
                )}
                <span
                  className={`relative grid h-12 w-12 place-items-center rounded-xl ${
                    unlocked ? `bg-gradient-to-br ${b.gradient}` : 'bg-surface-2 text-muted'
                  }`}
                >
                  {unlocked ? <b.icon size={22} className="text-[#04121c]" /> : <Lock size={18} />}
                </span>
              </div>
              <p className={`mt-3 text-sm font-semibold ${unlocked ? '' : 'text-muted'}`}>{b.title}</p>
              <p className="mt-0.5 text-xs text-muted">{b.desc}</p>
            </div>
          )
        })}
      </div>
    </SpotlightCard>
  )
}