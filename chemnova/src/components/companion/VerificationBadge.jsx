import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { verificationInfo } from '../../lib/companion'

const icons = { verified: ShieldCheck, corrected: ShieldAlert, unverified: ShieldAlert, unchecked: ShieldQuestion }

const tones = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  warn: 'border-amber-400/40 bg-amber-400/10 text-amber-500',
  muted: 'border-border bg-surface-2/60 text-muted',
}

export default function VerificationBadge({ status }) {
  const info = verificationInfo[status]
  if (!info) return null
  const Icon = icons[status]

  return (
    <span
      title={info.note}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[info.tone]}`}
    >
      <Icon size={13} /> {info.label}
    </span>
  )
}