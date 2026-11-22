import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

const messages = [
  { from: 'ai', text: 'Why does an SN2 reaction proceed with inversion of configuration?' },
  { from: 'user', text: 'The nucleophile attacks from the back side, opposite the leaving group.' },
  { from: 'ai', text: 'Good. Now, how would a bulky substrate change the rate, and why?' },
]

const metrics = [
  ['Scientific accuracy', 88],
  ['Conceptual understanding', 76],
  ['Explanation quality', 82],
]

export default function VivaPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="rounded-2xl border border-border bg-surface/70 shadow-2xl shadow-cyan-500/10 backdrop-blur-md"
    >
      {/* window bar */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <p className="font-mono text-xs text-muted">Viva · Organic Chemistry · Undergraduate</p>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
          Sample session
        </span>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_1fr]">
        {/* chat */}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.from === 'ai' ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.5 }}
              className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  m.from === 'ai'
                    ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-[#04121c]'
                    : 'bg-surface-2 text-muted'
                }`}
              >
                {m.from === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </span>
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.from === 'ai'
                    ? 'rounded-tl-sm border border-border bg-surface-2/70'
                    : 'rounded-tr-sm bg-gradient-to-r from-cyan-400/20 to-violet-400/20'
                }`}
              >
                {m.text}
              </p>
            </motion.div>
          ))}

          {/* typing indicator */}
          <div className="flex items-center gap-1.5 pl-11">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* live scores */}
        <div className="rounded-xl border border-border bg-surface-2/50 p-4">
          <p className="text-xs tracking-wide text-muted uppercase">Live evaluation</p>
          <div className="mt-4 space-y-5">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-mono text-accent">{value}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}