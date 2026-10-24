import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarRange } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import { ChartSkeleton } from '../ui/Skeleton'
import { TooltipCard, axisProps, gridProps } from '../ui/ChartTooltip'
import { colors } from '../../lib/theme'
import { addDays, fmtAxisKg, fmtNumber, fmtShortDate } from '../../lib/format'

function WeeklyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const w = payload[0].payload
  const rate = w.total_kg > 0 ? (w.recycled_kg / w.total_kg) * 100 : 0
  return (
    <TooltipCard
      title={`Week of ${fmtShortDate(w.week_start)}${w.partial ? ' (in progress)' : ''}`}
      rows={[
        { color: colors.warning, label: 'Landfill', value: w.landfill_kg, unit: 'kg' },
        { color: colors.primary, label: 'Recycled + composted', value: w.recycled_kg, unit: 'kg' },
        { label: 'Total', value: w.total_kg, unit: 'kg', strong: true },
      ]}
      footer={`${fmtNumber(rate)}% diverted from landfill`}
    />
  )
}

export default function WeeklyWasteChart({ data, latestDate, className = '' }) {
  const rows = data?.map((w) => ({ ...w, partial: latestDate && addDays(w.week_start, 6) > latestDate }))

  return (
    <Card className={className} innerClassName="p-5 sm:p-6">
      <CardHeader
        icon={CalendarRange}
        title="Weekly waste"
        subtitle="Last 12 weeks · Monday start"
        right={
          <div className="flex items-center gap-4">
            <LegendItem color={colors.primary} label="Recycled + composted" />
            <LegendItem color={colors.warning} label="Landfill" />
          </div>
        }
      />
      <div
        className="mt-5 h-[260px]"
        role="figure"
        aria-label={rows ? `Stacked bar chart of weekly waste for the last 12 weeks. Latest full week: ${fmtNumber(rows.at(rows.at(-1)?.partial ? -2 : -1)?.total_kg ?? 0, 0)} kg.` : 'Weekly waste chart, loading'}
      >
        {!rows ? (
          <ChartSkeleton height="100%" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="28%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="week_start" tickFormatter={fmtShortDate} minTickGap={12} {...axisProps} dy={8} />
              <YAxis tickFormatter={fmtAxisKg} width={44} {...axisProps} />
              <Tooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.035)', radius: 8 }} />
              <Bar dataKey="recycled_kg" stackId="w" fill={colors.primary} maxBarSize={28} stroke={colors.surface1} strokeWidth={1} animationDuration={800}>
                {rows.map((r) => (
                  <Cell key={r.week_start} fillOpacity={r.partial ? 0.45 : 1} />
                ))}
              </Bar>
              <Bar dataKey="landfill_kg" stackId="w" fill={colors.warning} maxBarSize={28} radius={[6, 6, 0, 0]} stroke={colors.surface1} strokeWidth={1} animationDuration={800}>
                {rows.map((r) => (
                  <Cell key={r.week_start} fillOpacity={r.partial ? 0.45 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {rows?.at(-1)?.partial && (
        <p className="mt-3 text-caption text-ink-faint">The faded bar is the current week, which is still in progress.</p>
      )}
    </Card>
  )
}
