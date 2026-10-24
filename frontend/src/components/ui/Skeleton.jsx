export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Bars-shaped placeholder for chart bodies. */
export function ChartSkeleton({ height = 260 }) {
  const bars = [42, 64, 50, 78, 58, 86, 70, 92, 66, 80, 60, 74]
  return (
    <div className="flex items-end gap-2 px-1" style={{ height }} aria-busy="true" aria-label="Loading chart">
      {bars.map((h, i) => (
        <div key={i} className="skeleton flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
