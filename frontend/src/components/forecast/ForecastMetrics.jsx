import { CalendarRange, Gauge, Ruler, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { colors } from '../../lib/theme'
import { fmtNumber } from '../../lib/format'
import { useCountUp } from '../../hooks/useCountUp'

function Tile({ icon: Icon, color, label, value, unit, dp = 1, caption, children }) {
  const shown = useCountUp(value)
  return (
    <motion.div variants={fadeUp} className="min-w-0">
      <section className="glass glass-hover h-full p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border"
            style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${color} 22%, transparent)` }}
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className="label-caps text-micro">{label}</div>
        </div>
        <div className="mt-5 min-h-[40px]">
          {value == null ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <div className="font-mono text-[30px] leading-none font-bold tracking-tight tabular-nums text-ink">
              {fmtNumber(shown, dp)}
              <span className="ml-1 text-title font-medium text-ink-muted">{unit}</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-caption text-ink-faint">{caption}</div>
        {children}
      </section>
    </motion.div>
  )
}

export default function ForecastMetrics({ data }) {
  const m = data?.metrics
  const days = data?.forecast.length ?? 7
  const predictedTotal = data && data.forecast.reduce((s, f) => s + f.predicted_kg, 0)
  const recent = data?.history.slice(-days)
  const recentTotal = recent?.length === days ? recent.reduce((s, h) => s + h.actual_kg, 0) : null
  const vsRecent = predictedTotal != null && recentTotal ? ((predictedTotal - recentTotal) / recentTotal) * 100 : null
  const avgDay = data?.history.length ? data.history.reduce((s, h) => s + h.actual_kg, 0) / data.history.length : null
  const improvement = m ? (1 - m.mae / m.baseline_mae) * 100 : null
  const better = improvement != null && improvement > 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
      <Tile icon={CalendarRange} color={colors.accent} label={`Next ${days} days`} value={predictedTotal} unit="kg" dp={0}
        caption={vsRecent != null ? `${vsRecent >= 0 ? '+' : '−'}${fmtNumber(Math.abs(vsRecent))}% vs the last ${days} days (actual)` : 'Predicted total'} />
      <Tile icon={Ruler} color={colors.primary} label="Model error (MAE)" value={m?.mae} unit="kg/day"
        caption={m && avgDay ? `≈ ${fmtNumber((m.mae / avgDay) * 100)}% of an average day, on ${m.holdout_days} held-out days` : 'Mean absolute error'} />
      <Tile icon={Gauge} color={colors.textMuted} label="Baseline error" value={m?.baseline_mae} unit="kg/day"
        caption={'Naive "same day last week" forecast'} />
      <Tile icon={Target} color={better ? colors.accent : colors.warning} label="Vs baseline" value={improvement == null ? null : Math.abs(improvement)} unit="%"
        caption={improvement == null ? '' : better ? 'Lower error than the naive forecast' : 'Higher error than the naive forecast'}>
        {improvement != null && (
          <span
            className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-micro font-bold ${better ? 'border-accent/25 bg-accent/10 text-accent' : 'border-warning/30 bg-warning/10 text-warning'}`}
          >
            {better ? 'Model beats baseline' : 'Baseline is currently better'}
          </span>
        )}
      </Tile>
    </div>
  )
}
