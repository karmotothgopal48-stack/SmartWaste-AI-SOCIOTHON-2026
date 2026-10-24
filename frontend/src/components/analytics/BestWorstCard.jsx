import { AlertTriangle, Scale, Trophy } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { BuildingTypeBadge } from '../ui/Chips'
import { colors } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

function Entry({ icon: Icon, label, building, color }) {
  return (
    <div className="rounded-xl border border-hair bg-surface-2/40 p-4">
      <div className="flex items-center gap-2 text-caption font-semibold" style={{ color }}>
        <Icon size={14} strokeWidth={2} /> {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-display text-title font-semibold text-ink">{building.building}</div>
          <div className="mt-1"><BuildingTypeBadge type={building.building_type} /></div>
        </div>
        <div className="font-mono text-[28px] leading-none font-bold tabular-nums text-ink">
          {fmtNumber(building.recycling_rate)}
          <span className="text-small font-medium text-ink-muted">%</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${building.recycling_rate}%`, background: color }} />
      </div>
    </div>
  )
}

export default function BestWorstCard({ best, worst, loading, className = '' }) {
  const gap = best && worst ? best.recycling_rate - worst.recycling_rate : null
  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader icon={Scale} title="Best vs worst building" subtitle="By recycling rate in this period" />
      <div className="mt-5 flex flex-1 flex-col gap-3">
        {loading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : best ? (
          <>
            <Entry icon={Trophy} label="Best recycler" building={best} color={colors.accent} />
            {worst && worst.building !== best.building && <Entry icon={AlertTriangle} label="Needs attention" building={worst} color={colors.warning} />}
            {gap > 0 && (
              <p className="text-small text-ink-muted">
                A <span className="font-mono font-bold text-ink">{fmtNumber(gap)}</span>-point gap. Bringing {worst.building} up to {best.building}'s
                level is the single biggest win available.
              </p>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-small text-ink-muted">No records in this period.</p>
        )}
      </div>
    </Card>
  )
}
