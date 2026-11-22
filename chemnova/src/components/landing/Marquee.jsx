const topics = [
  'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry',
  'Spectroscopy', 'Thermodynamics', 'Electrochemistry', 'Chemical Kinetics',
  'Stoichiometry', 'Periodic Table', 'Reaction Mechanisms', 'Nomenclature',
]

const fade = 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)'

export default function Marquee() {
  const row = [...topics, ...topics]

  return (
    <div
      className="overflow-hidden border-y border-border bg-surface/40 py-4 backdrop-blur-sm"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <div className="animate-marquee flex w-max">
        {row.map((t, i) => (
          <span
            key={i}
            className="mr-4 flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-1.5 text-sm whitespace-nowrap text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}