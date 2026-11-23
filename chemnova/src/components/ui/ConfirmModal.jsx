import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'

const tones = {
  default: {
    icon: 'bg-accent/15 text-accent',
    glow: 'from-cyan-400/25 via-violet-500/25 to-pink-500/20',
    confirm: 'btn-glow',
  },
  danger: {
    icon: 'bg-red-500/15 text-red-500',
    glow: 'from-red-500/25 via-red-500/10 to-pink-500/15',
    confirm:
      'inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600',
  },
}

function Dialog({
  title,
  message,
  icon: Icon = AlertCircle,
  tone = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null)
  const cancelRef = useRef(null)
  const titleId = useId()
  const messageId = useId()
  const t = tones[tone] ?? tones.default

  // Lock page scroll, focus the safe button, and give focus back when the dialog closes
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && !busy) {
      e.stopPropagation()
      onCancel()
      return
    }
    if (e.key !== 'Tab') return

    // Keep Tab inside the dialog
    const items = panelRef.current?.querySelectorAll('button:not([disabled])')
    if (!items?.length) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
      onKeyDown={onKeyDown}
    >
      <motion.div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-6 text-content shadow-2xl"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`pointer-events-none absolute -top-16 left-1/2 h-32 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r blur-3xl ${t.glow}`}
        />

        <div className="relative flex items-start gap-4">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${t.icon}`}>
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <p id={messageId} className="mt-1.5 text-sm leading-relaxed text-muted">
              {message}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="relative mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-outline justify-center disabled:pointer-events-none disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${t.confirm} disabled:pointer-events-none disabled:opacity-60`}
          >
            {busy && <Loader2 size={17} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Rendered in document.body, so no parent layout or animation can break its position
export default function ConfirmModal({ open, ...props }) {
  return createPortal(<AnimatePresence>{open && <Dialog key="confirm" {...props} />}</AnimatePresence>, document.body)
}