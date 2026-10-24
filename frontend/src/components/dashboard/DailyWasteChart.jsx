import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import { ChartSkeleton } from '../ui/Skeleton'
import { TooltipCard, axisProps, gridProps } from '../ui/ChartTooltip'
import { colors } from '../../lib/theme'
import { fmtAxisKg, fmtLongDate, fmtNumber, fmtShortDate } from '../../lib/format'

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const rate = d.total_kg > 0 ? (d.recycled_kg / d.total_kg) * 100 : 0
  return (
    <TooltipCard
      title={fmtLongDate(d.date)}
      rows={[
        { color: colors.warning, label: 'Landfill', value: d.landfill_kg, unit: 'kg' },
        { color: colors.primary, label: 'Recycled + composted', value: d.recycled_kg, unit: 'kg' },
        { label: 'Total', value: d.total_kg, unit: 'kg', strong: true },
      ]}
      footer={`${fmtNumber(rate)}% diverted from landfill`}
    />
  )
}

export default function DailyWasteChart({ data, className = '' }) {
  const total = data?.reduce((s, d) => s + d.total_kg, 0)
  const avg = data?.length ? total / data.length : 0

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader
        icon={Activity}
        title="Daily waste"
        subtitle={data ? `Last 30 days · avg ${fmtNumber(avg, 0)} kg/day` : 'Last 30 days'}
        right={
          <div className="flex items-center gap-4">
            <LegendItem color={colors.primary} label="Recycled + composted" />
            <LegendItem color={colors.warning} label="Landfill" />
          </div>
        }
      />
      <div
        className="mt-5 h-[260px] sm:h-[290px] lg:h-auto lg:min-h-[290px] lg:flex-1"
        role="figure"
        aria-label={data ? `Stacked area chart of daily waste over the last 30 days, averaging ${fmtNumber(avg, 0)} kg per day, split into recycled plus composted and landfill.` : 'Daily waste chart, loading'}
      >
        {!data ? (
          <ChartSkeleton height="100%" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="daily-recycled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.primary} stopOpacity={0.45} />
                  <stop offset="1" stopColor={colors.primary} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="daily-landfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.warning} stopOpacity={0.4} />
                  <stop offset="1" stopColor={colors.warning} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" tickFormatter={fmtShortDate} minTickGap={28} {...axisProps} dy={8} />
              <YAxis tickFormatter={fmtAxisKg} width={44} {...axisProps} />
              <Tooltip content={<DailyTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="recycled_kg"
                stackId="waste"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#daily-recycled)"
                activeDot={{ r: 5, stroke: colors.surface1, strokeWidth: 2, fill: colors.primary }}
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="landfill_kg"
                stackId="waste"
                stroke={colors.warning}
                strokeWidth={2}
                fill="url(#daily-landfill)"
                activeDot={{ r: 5, stroke: colors.surface1, strokeWidth: 2, fill: colors.warning }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
