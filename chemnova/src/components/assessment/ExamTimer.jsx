import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatClock } from '../../lib/assessment'

// deadline = server deadline in ms, offset = (server clock - this device's clock) in ms
export default function ExamTimer({ deadline, offset, onExpire }) {
  const [now, setNow] = useState(() => Date.now())
  const latest = useRef(onExpire)
  const fired = useRef(false)

  useEffect(() => {
    latest.current = onExpire
  })

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, deadline - (now + offset))
  const ended = remaining <= 0

  useEffect(() => {
    if (ended && !fired.current) {
      fired.current = true
      latest.current?.()
    }
  }, [ended])

  const tone =
    remaining <= 60_000
      ? 'border-red-500/50 bg-red-500/10 text-red-500'
      : remaining <= 300_000
        ? 'border-amber-400/50 bg-amber-400/10 text-amber-500'
        : 'border-border bg-surface-2/70 text-content'

  return (
    <div
      role="timer"
      aria-label="Time remaining"
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-semibold tabular-nums ${tone} ${
        remaining <= 60_000 && !ended ? 'animate-pulse' : ''
      }`}
    >
      <Clock size={16} />
      {formatClock(remaining / 1000)}
      <span className="sr-only" aria-live="polite">
        {remaining <= 60_000 ? 'Less than one minute left' : remaining <= 300_000 ? 'Five minutes left' : ''}
      </span>
    </div>
  )
}