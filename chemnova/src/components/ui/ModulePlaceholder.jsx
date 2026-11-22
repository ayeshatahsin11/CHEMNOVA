import { motion } from 'framer-motion'
import { Check, Hammer } from 'lucide-react'
import SpotlightCard from './SpotlightCard'

export default function ModulePlaceholder({ item }) {
  return (
    <div className="mx-auto max-w-5xl">
      <SpotlightCard className="p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-16 w-16 shrink-0">
            <span className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-50 blur-xl`} />
            <span className={`relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${item.gradient}`}>
              <item.icon size={30} className="text-[#04121c]" />
            </span>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/70 px-3 py-1 text-xs text-accent">
              <Hammer size={12} /> Under construction
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{item.title}</h2>
            <p className="mt-1 text-muted">{item.blurb}</p>
          </div>
        </div>
      </SpotlightCard>

      <p className="mt-10 font-mono text-sm text-accent">// what is coming</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {item.soon.map((text, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
          >
            <SpotlightCard className="p-5">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br ${item.gradient}`}>
                  <Check size={14} className="text-[#04121c]" />
                </span>
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}