import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import { ChartSkeleton } from '../ui/Skeleton'
import { TooltipCard, axisProps, gridProps } from '../ui/ChartTooltip'
import { colors } from '../../lib/theme'
import { addDays, fmtNumber, fmtShortDate, todayISO } from '../../lib/format'

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const w = payload[0].payload
  return (
    <TooltipCard
      title={`Week of ${fmtShortDate(w.week_start)}${w.partial ? ' (in progress)' : ''}`}
      rows={[
        { color: colors.accent, label: 'Recycling rate', value: w.recycling_rate, unit: '%', strong: true },
        { color: colors.primary, label: 'Diverted', value: w.diverted_kg, unit: 'kg' },
        { label: 'Total waste', value: w.total_kg, unit: 'kg' },
      ]}
    />
  )
}

export default function RecyclingTrendChart({ trend, className = '' }) {
  const today = todayISO()
  const rows = trend?.map((w) => ({ ...w, partial: addDays(w.week_start, 6) > today }))
  const full = rows?.filter((w) => !w.partial && w.total_kg > 0) ?? []
  const avg = full.length ? full.reduce((s, w) => s + w.recycling_rate, 0) / full.length : null
  const change = full.length > 1 ? full.at(-1).recycling_rate - full[0].recycling_rate : null
  const rates = rows?.filter((w) => w.total_kg > 0).map((w) => w.recycling_rate) ?? []
  // Round to whole tens with 10 points of headroom, and pass the ticks explicitly so labels never collide.
  const lo = rates.length ? Math.max(0, Math.floor(Math.min(...rates) / 10) * 10 - 10) : 0
  const hi = rates.length ? Math.min(100, Math.ceil(Math.max(...rates) / 10) * 10 + 10) : 100
  const domain = [lo, hi]
  const ticks = Array.from({ length: (hi - lo) / 10 + 1 }, (_, i) => lo + i * 10)

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader
        icon={TrendingUp}
        title="Recycling rate trend"
        subtitle={
          change != null
            ? `Last 12 weeks · ${change >= 0 ? 'up' : 'down'} ${fmtNumber(Math.abs(change))} points since week 1`
            : 'Last 12 weeks'
        }
        right={
          <div className="flex items-center gap-4">
            <LegendItem color={colors.accent} label="Recycling rate" />
            {avg != null && <LegendItem color={colors.textMuted} label={`Average ${fmtNumber(avg)}%`} dashed />}
          </div>
        }
      />
      <div
        className="mt-5 h-[260px] lg:h-auto lg:min-h-[280px] lg:flex-1"
        role="figure"
        aria-label={rows ? `Line chart of the weekly recycling rate over 12 weeks${change != null ? `, ${change >= 0 ? 'up' : 'down'} ${fmtNumber(Math.abs(change))} points` : ''}.` : 'Recycling trend, loading'}
      >
        {!rows ? (
          <ChartSkeleton height="100%" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.accent} stopOpacity={0.3} />
                  <stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="week_start" tickFormatter={fmtShortDate} minTickGap={16} {...axisProps} dy={8} />
              <YAxis domain={domain} ticks={ticks} interval={0} tickFormatter={(v) => `${v}%`} width={48} {...axisProps} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '3 3' }} />
              {avg != null && <ReferenceLine y={avg} stroke={colors.textMuted} strokeDasharray="4 4" strokeOpacity={0.6} />}
              <Area
                type="monotone"
                dataKey="recycling_rate"
                stroke={colors.accent}
                strokeWidth={2}
                fill="url(#trend-fill)"
                dot={{ r: 3, fill: colors.surface1, stroke: colors.accent, strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: colors.surface1, strokeWidth: 2, fill: colors.accent }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
