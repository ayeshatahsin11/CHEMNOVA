import { useState } from 'react'
import { Plus, Search, Trash2, Pencil, Check, X, MessageSquare, Inbox } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import ConfirmModal from '../ui/ConfirmModal'
import { timeAgo } from '../../lib/format'
import { panelClass } from '../../lib/viva'

const iconBtn =
  'grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-content disabled:opacity-50'

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  disabled,
  isGuest,
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // { id, value }
  const [saving, setSaving] = useState(false)
  const [renameError, setRenameError] = useState('')
  const [target, setTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const needle = query.trim().toLowerCase()
  const shown = needle ? conversations.filter((c) => c.title.toLowerCase().includes(needle)) : conversations

  const commitRename = async () => {
    const title = editing.value.trim()
    if (!title) {
      setEditing(null)
      return
    }
    setSaving(true)
    setRenameError('')
    try {
      await onRename(editing.id, title)
      setEditing(null)
    } catch (err) {
      setRenameError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await onDelete(target.id)
      setTarget(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`${panelClass} flex flex-col p-4 lg:max-h-[calc(100vh-9rem)]`}>
      <button
        type="button"
        onClick={onNew}
        disabled={disabled}
        className="btn-glow w-full justify-center disabled:pointer-events-none disabled:opacity-60"
      >
        <Plus size={17} /> New chat
      </button>

      {conversations.length > 3 && (
        <div className="relative mt-4">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Search conversations"
            placeholder="Search chats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2/60 py-2 pr-3 pl-9 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>
      )}

      {renameError && (
        <p role="alert" className="mt-3 text-xs text-red-500">
          {renameError}
        </p>
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No chats yet"
            text={
              isGuest
                ? 'Guest chats are not saved. Create a free account to keep your history.'
                : 'Your conversations will be saved here.'
            }
          />
        ) : shown.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">No chats match your search.</p>
        ) : (
          <ul className="space-y-1">
            {shown.map((c) => {
              const active = c.id === activeId
              const isEditing = editing?.id === c.id

              return (
                <li key={c.id}>
                  {isEditing ? (
                    <div className="flex items-center gap-1 rounded-xl border border-accent/40 bg-surface-2/60 p-2">
                      <input
                        autoFocus
                        aria-label="Conversation title"
                        value={editing.value}
                        maxLength={80}
                        disabled={saving}
                        onChange={(e) => setEditing({ id: c.id, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setEditing(null)
                        }}
                        className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                      />
                      <button type="button" onClick={commitRename} disabled={saving} aria-label="Save title" className={iconBtn}>
                        <Check size={15} />
                      </button>
                      <button type="button" onClick={() => setEditing(null)} disabled={saving} aria-label="Cancel" className={iconBtn}>
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`group flex items-center gap-1 rounded-xl border pr-1 transition ${
                        active ? 'border-accent/40 bg-accent/10' : 'border-transparent hover:bg-surface-2/60'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(c.id)}
                        aria-current={active ? 'page' : undefined}
                        className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5 text-left disabled:opacity-60"
                      >
                        <MessageSquare size={16} className="mt-0.5 shrink-0 text-accent" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{c.title}</span>
                          <span className="block truncate text-xs text-muted">
                            {c.lastMessageAt ? timeAgo(c.lastMessageAt) : ''}
                            {c.preview ? ` · ${c.preview}` : ''}
                          </span>
                        </span>
                      </button>

                      <span className="flex shrink-0 items-center opacity-100 transition lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setRenameError('')
                            setEditing({ id: c.id, value: c.title })
                          }}
                          aria-label={`Rename ${c.title}`}
                          className={iconBtn}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setTarget(c)}
                          aria-label={`Delete ${c.title}`}
                          className={`${iconBtn} hover:!text-red-500`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={Boolean(target)}
        tone="danger"
        icon={Trash2}
        title="Delete this conversation?"
        message={`This permanently removes "${target?.title ?? ''}" and all its messages. You cannot undo this.`}
        confirmLabel="Delete conversation"
        cancelLabel="Keep it"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deleting) return
          setTarget(null)
          setDeleteError('')
        }}
      />
    </div>
  )
}