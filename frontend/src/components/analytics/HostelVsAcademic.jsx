import { BedDouble, School, Split } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { buildingTypeColors } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

function summarise(buildings, type) {
  const rows = buildings.filter((b) => b.building_type === type)
  const total = rows.reduce((s, b) => s + b.total_kg, 0)
  const diverted = rows.reduce((s, b) => s + b.recycled_kg, 0)
  return { count: rows.length, total, diverted, perBuilding: rows.length ? total / rows.length : 0, rate: total > 0 ? (diverted / total) * 100 : 0 }
}

function Column({ icon: Icon, label, color, s }) {
  const stat = (name, value) => (
    <div className="flex items-baseline justify-between gap-3 border-t border-hair py-2.5 first:border-0">
      <dt className="text-small text-ink-muted">{name}</dt>
      <dd className="font-mono text-small font-bold tabular-nums text-ink">{value}</dd>
    </div>
  )
  return (
    <div className="rounded-xl border border-hair bg-surface-2/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} strokeWidth={1.75} style={{ color }} />
        <span className="font-display text-body font-semibold text-ink">{label}</span>
        <span className="text-micro text-ink-faint">{s.count} buildings</span>
      </div>
      <dl>
        {stat('Total waste', `${fmtNumber(s.total, 0)} kg`)}
        {stat('Per building', `${fmtNumber(s.perBuilding, 0)} kg`)}
        {stat('Kept out of landfill', `${fmtNumber(s.diverted, 0)} kg`)}
        {stat('Recycling rate', `${fmtNumber(s.rate)}%`)}
      </dl>
    </div>
  )
}

export default function HostelVsAcademic({ buildings, className = '' }) {
  const hostel = buildings && summarise(buildings, 'hostel')
  const academic = buildings && summarise(buildings, 'academic')
  const ratio = hostel && academic?.perBuilding > 0 ? hostel.perBuilding / academic.perBuilding : null

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader icon={Split} title="Hostels vs academic blocks" subtitle="Where the waste comes from, per building" />
      {!buildings ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Column icon={BedDouble} label="Hostels" color={buildingTypeColors.hostel} s={hostel} />
            <Column icon={School} label="Academic" color={buildingTypeColors.academic} s={academic} />
          </div>
          {ratio != null && (
            <p className="mt-4 text-small text-ink-muted">
              An average hostel produces <span className="font-mono font-bold text-ink">{fmtNumber(ratio)}×</span> the waste of an average academic
              building{hostel.rate < academic.rate ? ', and recycles a smaller share of it.' : '.'}
            </p>
          )}
        </>
      )}
    </Card>
  )
}
