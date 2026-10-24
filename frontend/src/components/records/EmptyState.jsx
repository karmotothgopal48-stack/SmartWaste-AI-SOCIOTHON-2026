import { Plus, RotateCcw } from 'lucide-react'
import Button from '../ui/Button'

export function EmptyBinIllustration({ className = 'h-28 w-auto' }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="empty-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A3E635" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <radialGradient id="empty-glow">
          <stop offset="0" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="1" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="78" cy="108" rx="52" ry="8" fill="url(#empty-glow)" />
      {/* bin */}
      <path d="M52 42h48l-5 58a6 6 0 0 1-6 5.5H63a6 6 0 0 1-6-5.5z" fill="#0F2219" stroke="rgba(16,185,129,0.45)" strokeWidth="2" />
      <path d="M64 54l2 40M76 54v40M88 54l-2 40" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 42h62" stroke="url(#empty-g)" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 42v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" fill="none" stroke="rgba(16,185,129,0.6)" strokeWidth="2" />
      {/* magnifier */}
      <circle cx="112" cy="72" r="15" fill="#06100C" fillOpacity="0.85" stroke="url(#empty-g)" strokeWidth="3" />
      <path d="M123 83l10 10" stroke="url(#empty-g)" strokeWidth="4" strokeLinecap="round" />
      <path d="M106 68a7 7 0 0 1 7-4" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* drifting leaf + sparks */}
      <path d="M28 30c0-8 5-13 13-13 0 8-5 13-13 13z" fill="url(#empty-g)" opacity="0.8" />
      <circle cx="128" cy="24" r="2.5" fill="#A3E635" opacity="0.7" />
      <circle cx="140" cy="44" r="1.5" fill="#38BDF8" opacity="0.7" />
      <circle cx="22" cy="62" r="2" fill="#FACC15" opacity="0.6" />
    </svg>
  )
}

export default function EmptyState({ filtered, onReset, onAdd }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <EmptyBinIllustration />
      <h3 className="mt-5 font-display text-heading font-semibold text-ink">
        {filtered ? 'No records match your filters' : 'No records yet'}
      </h3>
      <p className="mt-1.5 max-w-sm text-small text-ink-muted">
        {filtered ? 'Try a wider date range or a different building or category.' : 'Log the first bin weigh-in to start tracking campus waste.'}
      </p>
      <div className="mt-5">
        {filtered ? (
          <Button variant="secondary" icon={RotateCcw} onClick={onReset}>Reset filters</Button>
        ) : (
          <Button icon={Plus} onClick={onAdd}>Add record</Button>
        )}
      </div>
    </div>
  )
}
