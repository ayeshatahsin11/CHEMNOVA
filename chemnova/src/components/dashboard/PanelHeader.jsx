export default function PanelHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2/70 text-accent transition-transform duration-500 group-hover:rotate-6">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}