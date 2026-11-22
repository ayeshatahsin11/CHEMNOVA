import { useId } from 'react'
import { Activity } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SpotlightCard from '../ui/SpotlightCard'
import EmptyState from '../ui/EmptyState'
import PanelHeader from './PanelHeader'
import ChartTooltip from './ChartTooltip'
import useTheme from '../../hooks/useTheme'
import { chartColors } from '../../lib/chartTheme'

export default function ActivityChart({ data }) {
  const { theme } = useTheme()
  const c = chartColors(theme)
  const gid = useId().replace(/:/g, '')
  const total = data.reduce((sum, d) => sum + d.sessions, 0)

  return (
    <SpotlightCard className="h-full p-6">
      <PanelHeader
        icon={Activity}
        title="Learning activity"
        subtitle="Sessions over the last 14 days"
        right={
          total > 0 && (
            <span className="rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs text-accent">
              {total} sessions
            </span>
          )
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          text="Your daily study sessions will appear here as a chart once you get started."
          action={{ label: 'Start a viva', to: '/viva' }}
        />
      ) : (
        <div className="mt-6 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.accent} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: c.tick, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: c.tick, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip suffix=" sessions" />}
                cursor={{ stroke: c.accent, strokeOpacity: 0.35 }}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke={c.accent}
                strokeWidth={2.5}
                fill={`url(#${gid})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SpotlightCard>
  )
}