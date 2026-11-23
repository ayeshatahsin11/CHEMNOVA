export default function ChoiceCard({
  active,
  onClick,
  icon: Icon,
  title,
  description,
  badge,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full gap-3 rounded-xl border p-4 text-left transition duration-300 ${
        active ? 'border-accent bg-accent/10 ring-4 ring-accent/10' : 'border-border bg-surface-2/50'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:border-accent/50'}`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition ${
          active ? 'bg-gradient-to-br from-cyan-400 to-violet-500 text-[#04121c]' : 'bg-surface-2 text-accent'
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {title}
          {badge && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
              {badge}
            </span>
          )}
        </span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>}
      </span>
    </button>
  )
}