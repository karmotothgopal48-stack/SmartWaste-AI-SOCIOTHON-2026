import { useId } from 'react'
import { categoryColors } from '../../lib/theme'

// Particles orbiting a leaf inside a turning recycle loop. Pure SVG + CSS animation.
const ORBITS = [
  { r: 62, dur: 14, reverse: false, particles: [{ a: 20, s: 4, c: categoryColors.organic }, { a: 200, s: 3, c: categoryColors.plastic }] },
  { r: 86, dur: 22, reverse: true, particles: [{ a: 80, s: 5, c: categoryColors.paper }, { a: 250, s: 3.5, c: categoryColors.organic }, { a: 330, s: 2.5, c: '#A3E635' }] },
  { r: 108, dur: 32, reverse: false, particles: [{ a: 140, s: 4.5, c: categoryColors.other }, { a: 300, s: 3, c: categoryColors.metal }, { a: 40, s: 2.5, c: categoryColors.plastic }] },
]

export default function HeroIllustration({ className = '' }) {
  const id = useId()
  const g = `${id}-g`
  const core = `${id}-core`
  const arrow = `${id}-arrow`

  return (
    <svg viewBox="0 0 240 240" className={`hero-illustration ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A3E635" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <radialGradient id={core}>
          <stop offset="0" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="1" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
        <marker id={arrow} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="3" markerHeight="3" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill="#10B981" />
        </marker>
      </defs>

      <circle cx="120" cy="120" r="70" fill={`url(#${core})`} className="orbit-pulse" />

      {ORBITS.map((o) => (
        <circle key={o.r} cx="120" cy="120" r={o.r} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray="2 6" />
      ))}

      {ORBITS.map((o) => (
        <g key={`p${o.r}`} className="orbit" style={{ animationDuration: `${o.dur}s`, animationDirection: o.reverse ? 'reverse' : 'normal' }}>
          {o.particles.map((p) => {
            const rad = (p.a * Math.PI) / 180
            const x = 120 + o.r * Math.cos(rad)
            const y = 120 + o.r * Math.sin(rad)
            return (
              <g key={p.a}>
                <circle cx={x} cy={y} r={p.s * 2.4} fill={p.c} opacity="0.18" />
                <circle cx={x} cy={y} r={p.s} fill={p.c} />
              </g>
            )
          })}
        </g>
      ))}

      {/* Recycle loop */}
      <g className="orbit" style={{ animationDuration: '18s' }}>
        {['M156 120A36 36 0 0 1 120 156', 'M102 151.18A36 36 0 0 1 88.82 102', 'M102 88.82A36 36 0 0 1 151.18 102'].map((d) => (
          <path key={d} d={d} fill="none" stroke={`url(#${g})`} strokeWidth="3" strokeLinecap="round" markerEnd={`url(#${arrow})`} />
        ))}
      </g>

      {/* Leaf */}
      <g className="leaf-float">
        <path d="M104 136C104 116 116 104 136 104C136 124 124 136 104 136Z" fill={`url(#${g})`} />
        <path d="M108 132L126 114" stroke="#0B1912" strokeWidth="2" strokeLinecap="round" />
        <path d="M117 123L117 116M121 119L127 119" stroke="#0B1912" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  )
}
