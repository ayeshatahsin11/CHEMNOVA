import { useId } from 'react'
import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PanelHeader from '../dashboard/PanelHeader'
import ChartTooltip from '../dashboard/ChartTooltip'
import useTheme from '../../hooks/useTheme'
import { chartColors } from '../../lib/chartTheme'
import { typeMeta } from '../../lib/assessment'
import { panelClass } from '../../lib/viva'

export default function TypeBreakdownChart({ byType }) {
  const { theme } = useTheme()
  const c = chartColors(theme)
  const gid = useId().replace(/:/g, '')

  const data = byType.map((t) => ({ name: typeMeta[t.type]?.short ?? t.label, pct: t.pct }))

  return (
    <div className={panelClass}>
      <PanelHeader icon={BarChart3} title="Score by question type" subtitle="Percentage of marks earned" />
      <div className="mt-6 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.accent} />
                <stop offset="100%" stopColor={c.secondary} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: c.tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: c.grid }} />
            <Bar dataKey="pct" fill={`url(#${gid})`} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}