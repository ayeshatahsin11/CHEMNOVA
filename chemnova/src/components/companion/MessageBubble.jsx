import { useEffect, useRef, useState } from 'react'
import { Bot, User, Copy, Check, Volume2, Square } from 'lucide-react'
import Markdown from './MarkDown'
import VerificationBadge from './VerificationBadge'
import { verificationInfo } from '../../lib/companion'

const actionBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-content'

export default function MessageBubble({ message, modeLabel, canListen, listening, onListen, pending = false }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (message.role === 'user') {
    return (
      <div className="flex flex-row-reverse gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
          <User size={17} />
        </span>
        <div
          className={`max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-400/20 to-violet-400/20 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            pending ? 'opacity-70' : ''
          }`}
        >
          {message.content}
        </div>
      </div>
    )
  }

  const status = message.verification?.status

  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-[#04121c]">
        <Bot size={18} />
      </span>

      <div className="min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-sm border border-border bg-surface-2/50 px-4 py-3">
        <Markdown>{message.content}</Markdown>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {modeLabel && (
            <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-0.5 text-xs text-muted">
              {modeLabel}
            </span>
          )}
          {status && <VerificationBadge status={status} />}

          <span className="ml-auto flex items-center gap-1">
            {canListen && (
              <button type="button" onClick={onListen} className={actionBtn} aria-pressed={listening}>
                {listening ? (
                  <>
                    <Square size={13} className="text-accent" /> Stop
                  </>
                ) : (
                  <>
                    <Volume2 size={13} /> Listen
                  </>
                )}
              </button>
            )}
            <button type="button" onClick={copy} className={actionBtn}>
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </span>
        </div>

        {status && <p className="mt-2 text-xs text-muted">{verificationInfo[status]?.note}</p>}
      </div>
    </div>
  )
}