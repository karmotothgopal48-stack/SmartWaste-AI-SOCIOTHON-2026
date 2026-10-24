import { motion, useReducedMotion } from 'framer-motion'
import { ListOrdered } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { buildingTypeColors, colors, easeOutExpo } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'

/** All buildings ranked by recycling rate on a fixed 0–100% scale, with the campus average marked. */
export default function BuildingRanking({ buildings, campusRate, className = '' }) {
  const reduce = useReducedMotion()
  const rows = buildings?.filter((b) => b.total_kg > 0).sort((a, b) => b.recycling_rate - a.recycling_rate)

  return (
    <Card className={className} innerClassName="p-5 sm:p-6">
      <CardHeader
        icon={ListOrdered}
        title="Recycling rate by building"
        subtitle="Share of each building's waste kept out of landfill"
        right={
          <div className="flex flex-wrap items-center gap-4">
            <LegendItem color={buildingTypeColors.hostel} label="Hostel" />
            <LegendItem color={buildingTypeColors.academic} label="Academic" />
            {campusRate != null && <LegendItem color={colors.text} label="Campus avg" dashed />}
          </div>
        }
      />
      <ol className="mt-5 space-y-2.5">
        {!rows
          ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-7 w-full" />)
          : rows.length === 0
            ? <li className="py-8 text-center text-small text-ink-muted">No records in this period.</li>
            : rows.map((b, i) => (
                <li key={b.building} className="grid grid-cols-[1.25rem_minmax(0,7.5rem)_1fr_3.5rem] items-center gap-3 sm:grid-cols-[1.25rem_minmax(0,9rem)_1fr_3.5rem]">
                  <span className="font-mono text-caption text-ink-faint">{i + 1}</span>
                  <span className="truncate text-small font-medium text-ink">{b.building}</span>
                  <div className="relative h-6 rounded-md bg-white/[0.04]">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-md"
                      style={{ background: buildingTypeColors[b.building_type] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${b.recycling_rate}%` }}
                      transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.05, ease: easeOutExpo }}
                    />
                    {campusRate != null && (
                      <div className="absolute -inset-y-1 w-0 border-l-2 border-dashed border-ink/60" style={{ left: `${campusRate}%` }} aria-hidden="true" />
                    )}
                  </div>
                  <span className="text-right font-mono text-small font-bold tabular-nums text-ink">{fmtNumber(b.recycling_rate)}%</span>
                </li>
              ))}
      </ol>
      {campusRate != null && rows?.length > 0 && (
        <p className="mt-4 text-caption text-ink-faint">Dashed line: campus average {fmtNumber(campusRate)}%. Scale 0–100%.</p>
      )}
    </Card>
  )
}
