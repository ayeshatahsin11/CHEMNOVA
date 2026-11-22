export default function SpotlightCard({ children, className = '' }) {
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      onMouseMove={handleMove}
      className={`group spotlight rounded-2xl border border-border bg-surface/70 ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}