import { useEffect, useRef } from 'react'
import { Send, Mic, Square, Loader2 } from 'lucide-react'

// mic    = { supported, listening, interim, error, onToggle }
// accent = { value, options, onChange }
export default function ChatInput({ value, onChange, onSend, sending, disabled, maxChars, mic, accent, placeholder }) {
  const ref = useRef(null)
  const wasSending = useRef(false)

  // Grow with the text, up to a limit
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  // Put the cursor back in the box once an answer has arrived
  useEffect(() => {
    if (wasSending.current && !sending) ref.current?.focus()
    wasSending.current = sending
  }, [sending])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      onSend()
    }
  }

  const near = value.length > maxChars * 0.9

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface-2/60 p-3 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <textarea
          ref={ref}
          rows={1}
          aria-label="Your message"
          value={value}
          maxLength={maxChars}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="block w-full resize-none bg-transparent px-1 py-1 text-sm leading-relaxed outline-none placeholder:text-muted/60 disabled:opacity-60"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {mic.supported && (
            <>
              <button
                type="button"
                onClick={mic.onToggle}
                disabled={disabled}
                aria-pressed={mic.listening}
                aria-label={mic.listening ? 'Stop listening' : 'Speak your question'}
                className={`grid h-9 w-9 place-items-center rounded-lg border transition disabled:pointer-events-none disabled:opacity-50 ${
                  mic.listening
                    ? 'animate-pulse border-red-500 bg-red-500 text-white'
                    : 'border-border bg-surface text-muted hover:border-accent/50 hover:text-content'
                }`}
              >
                {mic.listening ? <Square size={14} /> : <Mic size={16} />}
              </button>

              <select
                aria-label="Accent for speaking and listening"
                value={accent.value}
                onChange={(e) => accent.onChange(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2 py-2 text-xs text-muted outline-none focus:border-accent"
              >
                {accent.options.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <span className={`ml-auto text-xs ${near ? 'text-amber-500' : 'text-muted'}`}>
            {value.length}/{maxChars}
          </span>

          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 px-4 py-2.5 text-sm font-semibold text-[#04121c] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
        </div>
      </div>

      {(mic.listening || mic.error) && (
        <p aria-live="polite" className={`mt-2 text-xs ${mic.error ? 'text-red-500' : 'text-muted'}`}>
          {mic.error ||
            (mic.interim ? <span className="italic">{mic.interim}...</span> : 'Listening. Your words appear in the box.')}
        </p>
      )}
    </div>
  )
}