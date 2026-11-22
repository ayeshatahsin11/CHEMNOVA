import { motion } from 'framer-motion'

const tones = {
  good: 'from-emerald-400 to-cyan-400',
  warn: 'from-amber-400 to-pink-500',
  accent: 'from-cyan-400 to-violet-500',
}

export default function TopicBars({ items, tone = 'accent' }) {
  return (
    <ul className="space-y-4">
      {items.map((t, i) => (
        <li key={t.name}>
          <div className="flex justify-between text-sm">
            <span>{t.name}</span>
            <span className="font-mono text-muted">{t.score}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${tones[tone]}`}
              initial={{ width: 0 }}
              animate={{ width: `${t.score}%` }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08 }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}