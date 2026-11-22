export default function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  const title = label ?? payload[0]?.payload?.subject

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-xl">
      {title && <p className="mb-0.5 text-muted">{title}</p>}
      <p className="text-sm font-semibold text-content">
        {payload[0].value}
        {suffix}
      </p>
    </div>
  )
}