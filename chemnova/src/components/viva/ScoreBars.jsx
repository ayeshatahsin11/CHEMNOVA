import { motion } from 'framer-motion'

const dimensions = [
  ['accuracy', 'Scientific accuracy'],
  ['understanding', 'Conceptual understanding'],
  ['explanation', 'Explanation quality'],
  ['reasoning', 'Reasoning ability'],
]

// max = 10 for a single question, 100 for the final report
export default function ScoreBars({ scores, max = 100 }) {
  return (
    <ul className="space-y-4">
      {dimensions.map(([key, label], i) => {
        const value = Number(scores?.[key] ?? 0)
        const pct = Math.max(0, Math.min(100, (value / max) * 100))
        const shown = max === 10 ? `${Math.round(value * 10) / 10}/10` : `${Math.round(value)}%`

        return (
          <li key={key}>
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span className="font-mono text-accent">{shown}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08 }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}