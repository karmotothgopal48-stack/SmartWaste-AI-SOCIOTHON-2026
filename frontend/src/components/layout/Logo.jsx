import { useId } from 'react'

/** Leaf inside two chasing recycle arrows. */
export function LogoMark({ size = 36, className = '' }) {
  const id = useId()
  const grad = `${id}-grad`
  const arrow = `${id}-arrow`

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A3E635" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <marker id={arrow} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="3.2" markerHeight="3.2" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill="#10B981" />
        </marker>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#0F2219" stroke={`url(#${grad})`} strokeOpacity="0.45" />
      {/* recycle loop */}
      <path d="M7.4 10.6A10 10 0 0 1 22.6 8.2" stroke={`url(#${grad})`} strokeWidth="1.8" strokeLinecap="round" markerEnd={`url(#${arrow})`} />
      <path d="M24.6 21.4A10 10 0 0 1 9.4 23.8" stroke={`url(#${grad})`} strokeWidth="1.8" strokeLinecap="round" markerEnd={`url(#${arrow})`} />
      {/* leaf */}
      <path d="M11 21C11 15 15 11 21 11C21 17 17 21 11 21Z" fill={`url(#${grad})`} />
      <path d="M12.6 19.4L17.6 14.4" stroke="#0F2219" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-[10px] bg-primary/30 blur-md" aria-hidden="true" />
        <LogoMark className="relative" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-heading font-bold tracking-tight text-ink">
          SmartWaste <span className="bg-linear-to-r from-accent to-primary bg-clip-text text-transparent">AI</span>
        </div>
        <div className="text-micro font-medium text-ink-faint">Campus waste intelligence</div>
      </div>
    </div>
  )
}
