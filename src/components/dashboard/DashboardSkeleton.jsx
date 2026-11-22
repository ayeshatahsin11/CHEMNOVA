const block = 'animate-pulse rounded-2xl bg-surface-2/60'

export default function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className={`${block} h-36`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-32`} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${block} h-80 lg:col-span-2`} />
        <div className={`${block} h-80`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${block} h-80`} />
        <div className={`${block} h-80`} />
      </div>
    </div>
  )
}