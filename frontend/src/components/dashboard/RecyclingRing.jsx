import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'
import { easeOutExpo } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

const R = 84
const C = 2 * Math.PI * R

export default function RecyclingRing({ rate, delta }) {
  const id = useId()
  const reduce = useReducedMotion()
  const shown = useCountUp(rate)
  const loading = rate == null
  const progress = Math.min(100, Math.max(0, rate ?? 0)) / 100

  return (
    <div className="relative mx-auto w-44 shrink-0 sm:w-52" role="img" aria-label={loading ? 'Loading recycling rate' : `Recycling rate ${fmtNumber(rate)} percent`}>
      {/* glow */}
      <div className="absolute inset-6 rounded-full bg-primary/25 blur-2xl" aria-hidden="true" />
      <svg viewBox="0 0 200 200" className="relative block h-auto w-full -rotate-90">
        <defs>
          <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A3E635" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* tick marks */}
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1="100"
            y1="4"
            x2="100"
            y2={i % 5 === 0 ? 9 : 7}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            transform={`rotate(${i * 6} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        {!loading && (
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={`url(#${id}-ring)`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ duration: reduce ? 0 : 1.4, ease: easeOutExpo }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.55))' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="skeleton h-10 w-24" />
        ) : (
          <>
            <div className="font-mono text-[38px] font-bold leading-none tabular-nums text-ink sm:text-[44px]">
              {fmtNumber(shown)}
              <span className="text-[20px] text-ink-muted sm:text-[22px]">%</span>
            </div>
            <div className="label-caps mt-2 text-micro">Recycling rate</div>
            {delta != null && (
              <div className={`mt-1.5 font-mono text-micro font-bold ${delta >= 0 ? 'text-accent' : 'text-danger'}`}>
                {delta >= 0 ? '▲ +' : '▼ −'}
                {fmtNumber(Math.abs(delta))} pts
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
