export default function ThinkingIndicator({ text }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted"
    >
      <span className="flex items-center gap-1.5">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
            style={{ animationDelay: `${d * 0.15}s` }}
          />
        ))}
      </span>
      {text}
    </div>
  )
}