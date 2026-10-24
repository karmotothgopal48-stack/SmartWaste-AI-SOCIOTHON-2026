import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { fmtNumber } from '../../lib/format'

/**
 * Change pill. Colour follows whether the change is *good*, not its direction.
 * goodWhen: 'up' | 'down'. unit: '%' or ' pts'.
 */
export default function DeltaBadge({ value, goodWhen = 'up', unit = '%' }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-hair bg-white/[0.03] px-2 py-0.5 text-micro font-semibold text-ink-faint">
        <Minus size={12} strokeWidth={2} /> n/a
      </span>
    )
  }
  const flat = Math.abs(value) < 0.05
  const up = value > 0
  const good = flat ? null : (up && goodWhen === 'up') || (!up && goodWhen === 'down')
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const tone = flat
    ? 'border-hair bg-white/[0.03] text-ink-muted'
    : good
      ? 'border-accent/25 bg-accent/10 text-accent'
      : 'border-danger/25 bg-danger/10 text-danger'

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-micro font-bold tabular-nums ${tone}`}
      aria-label={`${up ? 'up' : 'down'} ${Math.abs(value).toFixed(1)}${unit} versus previous period`}
    >
      <Icon size={12} strokeWidth={2.25} />
      {up ? '+' : flat ? '' : '−'}
      {fmtNumber(Math.abs(value), 1)}
      {unit}
    </span>
  )
}
