import { Area, ComposedChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LineChart as LineIcon } from 'lucide-react'
import { Card, CardHeader, LegendItem } from '../ui/Card'
import { ChartSkeleton } from '../ui/Skeleton'
import { TooltipCard, axisProps, gridProps } from '../ui/ChartTooltip'
import { colors } from '../../lib/theme'
import { fmtAxisKg, fmtLongDate, fmtShortDate } from '../../lib/format'

/** One row per day: history has `actual`, forecast has `predicted` + band. The last history day carries both, so the lines join. */
export function buildRows(history, forecast) {
  const rows = history.map((h) => ({ date: h.date, actual: h.actual_kg }))
  const last = rows.at(-1)
  if (last && forecast.length) Object.assign(last, { predicted: last.actual, bandBase: last.actual, bandSize: 0, junction: true })
  for (const f of forecast) {
    rows.push({ date: f.date, predicted: f.predicted_kg, lower: f.lower, upper: f.upper, bandBase: f.lower, bandSize: f.upper - f.lower })
  }
  return rows
}

function ForecastTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  if (r.actual != null) {
    return <TooltipCard title={fmtLongDate(r.date)} rows={[{ color: colors.primary, label: 'Actual', value: r.actual, unit: 'kg', strong: true }]} />
  }
  return (
    <TooltipCard
      title={fmtLongDate(r.date)}
      rows={[
        { color: colors.accent, label: 'Predicted', value: r.predicted, unit: 'kg', strong: true },
        { label: 'Likely range', value: `${Math.round(r.lower)}–${Math.round(r.upper)}`, unit: 'kg' },
      ]}
      footer="AI estimate, not a guaranteed value"
    />
  )
}

export default function ForecastChart({ data, className = '' }) {
  const rows = data && buildRows(data.history, data.forecast)
  const lastActual = data?.history.at(-1)?.date

  return (
    <Card className={className} innerClassName="p-5 sm:p-6">
      <CardHeader
        icon={LineIcon}
        title="Actual vs forecast"
        subtitle="Total campus waste per day, last 30 days and the forecast"
        right={
          <div className="flex flex-wrap items-center gap-4">
            <LegendItem color={colors.primary} label="Actual" />
            <LegendItem color={colors.accent} label="Forecast (estimate)" dashed />
            <span className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-muted">
              <span className="h-2.5 w-4 rounded-sm" style={{ background: 'rgba(163,230,53,0.18)' }} aria-hidden="true" />
              Likely range
            </span>
          </div>
        }
      />
      <div
        className="mt-5 h-[300px] sm:h-[340px]"
        role="figure"
        aria-label={data ? `Chart of actual daily waste for ${data.history.length} days followed by a ${data.forecast.length}-day forecast with a likely range.` : 'Forecast chart, loading'}
      >
        {!rows ? (
          <ChartSkeleton height="100%" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="fc-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
                  <stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" tickFormatter={fmtShortDate} minTickGap={24} {...axisProps} dy={8} />
              <YAxis tickFormatter={fmtAxisKg} width={44} {...axisProps} />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '3 3' }} />
              {/* Band: an invisible base up to `lower`, then the range stacked on top. */}
              <Area dataKey="bandBase" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} activeDot={false} legendType="none" />
              <Area dataKey="bandSize" stackId="band" stroke="none" fill={colors.accent} fillOpacity={0.15} isAnimationActive={false} activeDot={false} legendType="none" />
              <Area type="monotone" dataKey="actual" stroke={colors.primary} strokeWidth={2} fill="url(#fc-actual)"
                activeDot={{ r: 5, stroke: colors.surface1, strokeWidth: 2, fill: colors.primary }} animationDuration={800} connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke={colors.accent} strokeWidth={2} strokeDasharray="6 4"
                dot={(p) => (p.payload.junction || p.value == null ? <g key={p.key} /> : <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill={colors.surface1} stroke={colors.accent} strokeWidth={2} />)}
                activeDot={{ r: 5, stroke: colors.surface1, strokeWidth: 2, fill: colors.accent }} animationDuration={800} />
              {lastActual && (
                <ReferenceLine x={lastActual} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3"
                  label={{ value: 'Latest data', position: 'insideTopRight', fill: colors.textMuted, fontSize: 11 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
