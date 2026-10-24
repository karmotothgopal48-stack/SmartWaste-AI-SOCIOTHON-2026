import { Hash, Leaf, Mountain, Scale } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import { colors } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

function Stat({ icon: Icon, label, color, children }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-hair bg-surface-1/60 px-3 py-2 backdrop-blur">
      <Icon size={15} strokeWidth={1.75} style={{ color }} className="shrink-0" />
      <div className="min-w-0">
        <div className="text-micro font-semibold tracking-wider text-ink-faint uppercase">{label}</div>
        <div className="truncate font-mono text-body font-bold tabular-nums text-ink">{children}</div>
      </div>
    </div>
  )
}

export default function SummaryStrip({ summary, loading, failed }) {
  const value = (fn) => (summary ? fn(summary) : failed ? <span className="text-ink-faint">—</span> : <Skeleton className="mt-1 h-4 w-16" />)
  return (
    <div className={`grid flex-1 grid-cols-2 gap-2 transition-opacity md:grid-cols-4 ${loading && summary ? 'opacity-60' : ''}`} aria-live="polite">
      <Stat icon={Scale} label="Total weight" color={colors.text}>
        {value((s) => `${fmtNumber(s.total_kg)} kg`)}
      </Stat>
      <Stat icon={Hash} label="Records" color={colors.textMuted}>
        {value((s) => s.record_count.toLocaleString('en-US'))}
      </Stat>
      <Stat icon={Leaf} label="Recycling rate" color={colors.accent}>
        {value((s) => `${fmtNumber(s.recycling_rate)}%`)}
      </Stat>
      <Stat icon={Mountain} label="Landfill" color={colors.warning}>
        {value((s) => `${fmtNumber(s.landfill_kg)} kg`)}
      </Stat>
    </div>
  )
}
