import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Inbox, Trash2, Play } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import PanelHeader from '../dashboard/PanelHeader'
import { timeAgo } from '../../lib/format'
import { modeLabels, panelClass, scoreClass } from '../../lib/viva'

export default function SessionHistory({ sessions, isGuest, onDelete }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const handleDelete = async (s) => {
    if (!window.confirm('Delete this viva and its report?')) return
    setBusy(s.id)
    setError('')
    try {
      await onDelete(s.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={panelClass}>
      <PanelHeader icon={History} title="Your vivas" subtitle="Resume or review past sessions" />

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {sessions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No vivas yet"
          text={
            isGuest
              ? 'Guest sessions are not saved. Create a free account to keep your history.'
              : 'Your completed and in-progress vivas will be listed here.'
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-3">
              <Link
                to={`/viva/${s.id}`}
                className="min-w-0 flex-1 rounded-lg px-2 py-1 transition hover:bg-surface-2/60"
              >
                <p className="truncate text-sm font-medium">{s.subject}</p>
                <p className="truncate text-xs text-muted">
                  {modeLabels[s.mode] ?? s.mode} · {s.difficulty} · {timeAgo(s.createdAt)}
                </p>
              </Link>

              {s.status === 'completed' ? (
                <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${scoreClass(s.score ?? 0)}`}>
                  {Math.round(s.score ?? 0)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  <Play size={11} /> Resume
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDelete(s)}
                disabled={busy === s.id}
                aria-label={`Delete ${s.subject} viva`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}