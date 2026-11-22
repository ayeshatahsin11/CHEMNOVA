import { Target, TrendingUp, TrendingDown } from 'lucide-react'
import SpotlightCard from '../ui/SpotlightCard'
import EmptyState from '../ui/EmptyState'
import PanelHeader from './PanelHeader'
import TopicBars from './TopicBars'

export default function TopicsPanel({ strong, weak }) {
  const empty = strong.length === 0 && weak.length === 0

  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader icon={Target} title="Strong and weak topics" subtitle="Based on your viva and test results" />

      {empty ? (
        <EmptyState
          icon={Target}
          title="Nothing to analyse yet"
          text="After a few sessions we will show what you have mastered and what needs more work."
          action={{ label: 'Take a quick test', to: '/assessments' }}
        />
      ) : (
        <div className="mt-6 space-y-7">
          {strong.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-emerald-500 uppercase">
                <TrendingUp size={14} /> Strong
              </p>
              <TopicBars items={strong} tone="good" />
            </div>
          )}
          {weak.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-amber-500 uppercase">
                <TrendingDown size={14} /> Needs work
              </p>
              <TopicBars items={weak} tone="warn" />
            </div>
          )}
        </div>
      )}
    </SpotlightCard>
  )
}