import SpotlightCard from '../ui/SpotlightCard'
import useCountUp from '../../hooks/useCountUp'

export default function StatCard({ icon: Icon, label, value, hint, emptyText, gradient }) {
  const shown = useCountUp(value)

  return (
    <SpotlightCard className="h-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{shown}</p>
        </div>
        <div className="relative h-11 w-11">
          <span
            className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-40 blur-lg transition-opacity duration-500 group-hover:opacity-90`}
          />
          <span className={`relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon size={20} className="text-[#04121c]" />
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{value === 0 ? emptyText : hint}</p>
    </SpotlightCard>
  )
}