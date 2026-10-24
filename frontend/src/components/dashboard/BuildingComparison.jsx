import { motion, useReducedMotion } from 'framer-motion'
import { BedDouble, Building2, School } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { buildingTypeColors, easeOutExpo } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

const GROUPS = [
  { type: 'hostel', label: 'Hostels', icon: BedDouble },
  { type: 'academic', label: 'Academic blocks', icon: School },
]

function BuildingRow({ b, max, color, index }) {
  const reduce = useReducedMotion()
  const width = max > 0 ? (b.total_kg / max) * 100 : 0
  const diverted = b.total_kg > 0 ? (b.recycled_kg / b.total_kg) * 100 : 0

  return (
    <li
      tabIndex={0}
      className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 outline-offset-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] sm:grid-cols-[minmax(0,8.5rem)_1fr_auto]"
      aria-label={`${b.building}: ${fmtNumber(b.total_kg, 0)} kg total, ${fmtNumber(b.recycling_rate)}% recycled`}
    >
      <span className="truncate text-small font-medium text-ink">{b.building}</span>
      <div className="relative order-last col-span-2 h-6 sm:order-none sm:col-span-1 sm:h-7">
        <motion.div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-r-[6px] rounded-l-sm"
          style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)` }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.15 + index * 0.05, ease: easeOutExpo }}
        >
          {/* diverted share, solid */}
          <div className="h-full rounded-l-sm" style={{ width: `${diverted}%`, background: color, opacity: 0.85 }} />
        </motion.div>
      </div>
      <span className="text-right whitespace-nowrap sm:w-[118px]">
        <span className="font-mono text-small font-bold tabular-nums text-ink sm:block">{fmtNumber(b.total_kg, 0)} kg</span>
        <span className="ml-2 font-mono text-micro tabular-nums text-ink-muted sm:ml-0 sm:block">{fmtNumber(b.recycling_rate)}% recycled</span>
      </span>

      {/* hover detail */}
      <div className="pointer-events-none absolute right-24 bottom-full z-10 mb-1 hidden min-w-[200px] rounded-xl border border-strong bg-surface-2/95 px-3.5 py-3 text-caption shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl group-hover:block group-focus-visible:block">
        <div className="mb-2 font-display font-semibold text-ink">{b.building}</div>
        <div className="flex justify-between gap-6 text-ink-muted">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: color }} />Recycled + composted</span>
          <span className="font-mono text-ink">{fmtNumber(b.recycled_kg)} kg</span>
        </div>
        <div className="mt-1.5 flex justify-between gap-6 text-ink-muted">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: `color-mix(in srgb, ${color} 30%, transparent)` }} />Landfill</span>
          <span className="font-mono text-ink">{fmtNumber(b.landfill_kg)} kg</span>
        </div>
      </div>
    </li>
  )
}

export default function BuildingComparison({ data, className = '' }) {
  const max = data ? Math.max(...data.map((b) => b.total_kg)) : 0

  return (
    <Card className={className} innerClassName="p-5 sm:p-6">
      <CardHeader
        icon={Building2}
        title="Building comparison"
        subtitle="Last 30 days · solid part of each bar = recycled + composted"
        right={
          <div className="flex items-center gap-4">
            <LegendItem color={buildingTypeColors.hostel} label="Hostel" />
            <LegendItem color={buildingTypeColors.academic} label="Academic" />
          </div>
        }
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {GROUPS.map(({ type, label, icon: Icon }, gi) => {
          const rows = data?.filter((b) => b.building_type === type).sort((a, b) => b.total_kg - a.total_kg)
          const total = rows?.reduce((s, b) => s + b.total_kg, 0) ?? 0
          const diverted = rows?.reduce((s, b) => s + b.recycled_kg, 0) ?? 0
          const color = buildingTypeColors[type]
          return (
            <div key={type} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-hair px-2 pb-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={16} strokeWidth={1.75} className="shrink-0" style={{ color }} />
                  <span className="font-display text-body font-semibold whitespace-nowrap text-ink">{label}</span>
                  <span className="hidden text-micro whitespace-nowrap text-ink-faint sm:inline">{rows ? `${rows.length} buildings` : ''}</span>
                </div>
                {rows ? (
                  <div className="text-right font-mono text-caption whitespace-nowrap tabular-nums">
                    <span className="font-bold text-ink">{fmtNumber(total, 0)} kg</span>
                    <span className="ml-2 text-ink-muted">{fmtNumber(total ? (diverted / total) * 100 : 0)}%</span>
                  </div>
                ) : (
                  <Skeleton className="h-4 w-28" />
                )}
              </div>
              <ul className="space-y-0.5">
                {rows
                  ? rows.map((b, i) => <BuildingRow key={b.building} b={b} max={max} color={color} index={gi * 3 + i} />)
                  : Array.from({ length: type === 'hostel' ? 3 : 4 }, (_, i) => <Skeleton key={i} className="my-2 h-7 w-full" />)}
              </ul>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
