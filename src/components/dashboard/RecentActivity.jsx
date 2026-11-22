import { History, Inbox, Mic, ClipboardCheck } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import EmptyState from '../ui/EmptyState'
import PanelHeader from './PanelHeader'
import { timeAgo } from '../../lib/format'

const types = {
  viva: { icon: Mic, label: 'Viva', gradient: 'from-cyan-400 to-blue-500' },
  assessment: { icon: ClipboardCheck, label: 'Assessment', gradient: 'from-violet-400 to-fuchsia-500' },
}

function scoreClass(score) {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-500'
  if (score >= 50) return 'bg-amber-400/15 text-amber-500'
  return 'bg-red-500/15 text-red-500'
}

export default function RecentActivity({ items }) {
  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader icon={History} title="Recent activity" subtitle="Your latest vivas and assessments" />

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          text="Completed vivas and assessments will be listed here so you can revisit them."
          action={{ label: 'Start your first viva', to: '/viva' }}
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => {
            const t = types[item.type]
            return (
              <li key={item.id} className="flex items-center gap-4 py-3.5">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.gradient}`}>
                  <t.icon size={18} className="text-[#04121c]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">
                    {t.label} · {item.subject} · {timeAgo(item.date)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${scoreClass(item.score)}`}>
                  {item.score}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SpotlightCard>
  )
}