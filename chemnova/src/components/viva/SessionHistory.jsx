import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Inbox, Trash2, ArrowRight } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import ConfirmModal from '../ui/ConfirmModal'
import PanelHeader from '../dashboard/PanelHeader'
import { timeAgo } from '../../lib/format'
import { modeLabels, panelClass, scoreClass } from '../../lib/viva'

export default function SessionHistory({ sessions, isGuest, onDelete }) {
  const [target, setTarget] = useState(null) // the session waiting for delete confirmation
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const closeModal = () => {
    if (busy) return
    setTarget(null)
    setError('')
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError('')
    try {
      await onDelete(target.id)
      setTarget(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={panelClass}>
      <PanelHeader icon={History} title="Your vivas" subtitle="Resume or review past sessions" />

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
            <li key={s.id} className="flex items-center gap-2 py-2">
              <Link
                to={`/viva/${s.id}`}
                className="group/row flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface-2/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.subject}</span>
                  <span className="block truncate text-xs text-muted">
                    {modeLabels[s.mode] ?? s.mode} · {s.difficulty} · {timeAgo(s.createdAt)}
                  </span>
                </span>

                {s.status === 'completed' ? (
                  <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${scoreClass(s.score ?? 0)}`}>
                    {Math.round(s.score ?? 0)}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 px-3 py-1 text-xs font-semibold text-[#04121c] transition group-hover/row:shadow-lg group-hover/row:shadow-cyan-400/30">
                    Resume
                    <ArrowRight size={12} className="transition-transform group-hover/row:translate-x-0.5" />
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setTarget(s)}
                aria-label={`Delete ${s.subject} viva`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(target)}
        tone="danger"
        icon={Trash2}
        title="Delete this viva?"
        message={`This permanently removes your ${target?.subject ?? ''} viva and its report. You cannot undo this.`}
        confirmLabel="Delete viva"
        cancelLabel="Keep it"
        busy={busy}
        error={error}
        onConfirm={confirmDelete}
        onCancel={closeModal}
      />
    </div>
  )
}