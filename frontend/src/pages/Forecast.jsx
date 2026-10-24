import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit, ClipboardPlus, Hourglass, Sparkles } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getForecast } from '../services/api'
import { Card, CardHeader, fadeUp, staggerContainer } from '../components/ui/Card'
import { buttonClass } from '../components/ui/Button'
import SegmentedControl from '../components/ui/SegmentedControl'
import Skeleton from '../components/ui/Skeleton'
import { ErrorCard } from '../components/ui/StatusCards'
import ForecastChart from '../components/forecast/ForecastChart'
import ForecastMetrics from '../components/forecast/ForecastMetrics'
import ForecastTable from '../components/forecast/ForecastTable'

const HORIZONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
]
const MIN_DAYS = 21

function EstimatePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-1 text-caption font-semibold text-accent">
      <Sparkles size={13} strokeWidth={2} /> AI estimate
    </span>
  )
}

function Header({ data, loading, horizon, onHorizon }) {
  return (
    <motion.section variants={fadeUp} className="glass edge-glow relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">Campus waste forecast</h2>
            <EstimatePill />
          </div>
          {data ? (
            <p className="mt-2 max-w-3xl text-small leading-relaxed text-ink-muted">{data.note}</p>
          ) : loading ? (
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          ) : null}
        </div>
        <SegmentedControl label="Forecast horizon" options={HORIZONS} value={horizon} onChange={onHorizon} />
      </div>
    </motion.section>
  )
}

function Insufficient({ data }) {
  const daysWithData = data.history.filter((h) => h.actual_kg > 0).length
  const pct = Math.min(100, (daysWithData / MIN_DAYS) * 100)
  return (
    <motion.section variants={fadeUp} className="glass flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
        <Hourglass size={20} strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-heading font-semibold text-ink">Not enough data to forecast yet</h3>
      <p className="mt-1 max-w-md text-small text-ink-muted">
        The model needs at least {MIN_DAYS} days of records to learn weekly patterns. You have {daysWithData}.
      </p>
      <div className="mt-5 w-full max-w-sm">
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={MIN_DAYS} aria-valuenow={daysWithData} aria-label="Days of data collected">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-right font-mono text-caption text-ink-faint">{daysWithData} / {MIN_DAYS} days</div>
      </div>
      <Link to="/records" className={`${buttonClass('primary')} mt-5`}>
        <ClipboardPlus size={15} strokeWidth={2} /> Add records
      </Link>
    </motion.section>
  )
}

function MethodCard() {
  const items = [
    ['Data', 'Daily campus totals from every record; days with nothing logged count as 0.'],
    ['Features', 'Day of week, yesterday, the same day last week, the 7-day average, the same weekday over 4 weeks, and the overall trend.'],
    ['Model', 'A random forest (scikit-learn) predicts one day at a time, feeding each prediction into the next.'],
    ['Check', 'The last 14 days are hidden, forecast, and compared with what really happened, and with a simple "same day last week" guess.'],
    ['Range', 'The shaded band is ±1.5 × that validation error.'],
  ]
  return (
    <Card innerClassName="p-5 sm:p-6">
      <CardHeader icon={BrainCircuit} title="How the forecast works" subtitle="Simple, testable, and honest about its error" />
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map(([term, text]) => (
          <div key={term}>
            <dt className="label-caps text-micro text-accent">{term}</dt>
            <dd className="mt-1 text-small leading-relaxed text-ink-muted">{text}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export default function Forecast() {
  const [params, setParams] = useSearchParams()
  const horizon = params.get('days') === '14' ? '14' : '7'
  const { data, error, loading, reload } = useApi(() => getForecast({ days: Number(horizon) }), [horizon])
  const setHorizon = (v) => setParams(v === '7' ? {} : { days: v }, { replace: true })
  const ok = data?.status === 'ok'

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 lg:gap-6">
      <Header data={data} loading={loading} horizon={horizon} onHorizon={setHorizon} />

      {error && !data ? (
        <ErrorCard error={error} onRetry={reload} title="Couldn't load the forecast" />
      ) : data && !ok ? (
        <Insufficient data={data} />
      ) : (
        <div className={`grid gap-4 transition-opacity lg:gap-6 ${loading && data ? 'opacity-60' : ''}`} aria-busy={loading}>
          <ForecastMetrics data={data} />
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <ForecastChart data={data} className="lg:col-span-2" />
            <ForecastTable data={data} />
          </div>
          <MethodCard />
        </div>
      )}
    </motion.div>
  )
}
