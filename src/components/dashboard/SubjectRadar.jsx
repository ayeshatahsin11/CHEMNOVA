import { BarChart3 } from 'lucide-react'
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip,
} from 'recharts'
import SpotlightCard from '../ui/SpotlightCard'
import EmptyState from '../ui/EmptyState'
import PanelHeader from './PanelHeader'
import ChartTooltip from './ChartTooltip'
import TopicBars from './TopicBars'
import useTheme from '../../hooks/useTheme'
import { chartColors } from '../../lib/chartTheme'

export default function SubjectRadar({ subjects }) {
  const { theme } = useTheme()
  const c = chartColors(theme)

  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader icon={BarChart3} title="Subject performance" subtitle="Average score per area" />

      {subjects.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No scores yet"
          text="Take an assessment and your strengths across chemistry areas will show up here."
          action={{ label: 'Open Assessment Studio', to: '/assessments' }}
        />
      )}

      {/* A radar needs at least 3 points, so show bars until then */}
      {subjects.length > 0 && subjects.length < 3 && (
        <div className="mt-6">
          <TopicBars items={subjects.map((s) => ({ name: s.subject, score: s.score }))} />
        </div>
      )}

      {subjects.length >= 3 && (
        <div className="mt-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subjects} outerRadius="72%">
              <PolarGrid stroke={c.grid} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: c.tick, fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <Radar
                dataKey="score"
                stroke={c.secondary}
                strokeWidth={2}
                fill={c.secondary}
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SpotlightCard>
  )
}