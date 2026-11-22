import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface-2/70 text-accent">
        <span className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />
        <Icon size={24} className="relative" />
      </span>
      <h4 className="mt-4 font-semibold">{title}</h4>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          {action.label} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  )
}