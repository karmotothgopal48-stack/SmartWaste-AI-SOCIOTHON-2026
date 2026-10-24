import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardPlus, History, Inbox, Leaf, Mountain, Recycle, Trash2 } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { getBuildingStats, getRecyclingAnalytics, getSummary } from '../services/api'
import { fadeUp, staggerContainer } from '../components/ui/Card'
import { buttonClass } from '../components/ui/Button'
import SegmentedControl from '../components/ui/SegmentedControl'
import { EmptyCard, ErrorCard } from '../components/ui/StatusCards'
import KpiCard from '../components/dashboard/KpiCard'
import InsightsCard from '../components/dashboard/InsightsCard'
import RecyclingTrendChart from '../components/analytics/RecyclingTrendChart'
import BestWorstCard from '../components/analytics/BestWorstCard'
import BuildingRanking from '../components/analytics/BuildingRanking'
import HostelVsAcademic from '../components/analytics/HostelVsAcademic'
import { colors } from '../lib/theme'
import { addDays, pctChange, todayISO } from '../lib/format'

const PERIODS = [
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: 'all', label: 'All time', days: null },
]

async function loadAnalytics(days) {
  const today = todayISO()
  const range = days ? { start_date: addDays(today, -(days - 1)), end_date: today } : { start_date: '1970-01-01' }
  const prevRange = days && { start_date: addDays(today, -(2 * days - 1)), end_date: addDays(today, -days) }
  const filters = days ? range : {}

  const [summary, prevSummary, analytics, buildings, trendSource] = await Promise.all([
    getSummary(range),
    prevRange ? getSummary(prevRange) : null,
    getRecyclingAnalytics(filters),
    getBuildingStats(filters),
    // The 12-week trend always uses all data; a 30-day filter would blank out older weeks.
    days ? getRecyclingAnalytics() : null,
  ])
  return { summary, prevSummary, analytics, buildings, trend: (trendSource ?? analytics).trend }
}

export default function Analytics() {
  const [params, setParams] = useSearchParams()
  const period = PERIODS.find((p) => p.value === params.get('period')) ?? PERIODS[0]
  const { data, error, loading, reload } = useApi(() => loadAnalytics(period.days), [period.value])

  const setPeriod = (value) => setParams(value === '30' ? {} : { period: value }, { replace: true })

  const s = data?.summary
  const p = data?.prevSummary
  const hasPrev = p?.record_count > 0
  const delta = (cur, prev) => (period.days ? (hasPrev ? pctChange(cur, prev) : null) : undefined)
  const diverted = s && s.recycled_kg + s.composted_kg
  const spark = data?.trend.map((w) => ({ ...w, landfill_kg: w.total_kg - w.diverted_kg }))
  const caption = period.days ? `vs previous ${period.days} days` : 'All records'
  const empty = s && s.record_count === 0

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 lg:gap-6">
      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-ink-muted">How much campus waste is kept out of landfill, and where to act next.</p>
        <SegmentedControl label="Period" options={PERIODS} value={period.value} onChange={setPeriod} />
      </motion.div>

      {error && !data ? (
        <ErrorCard error={error} onRetry={reload} title="Couldn't load analytics" />
      ) : empty ? (
        <EmptyCard icon={Inbox} title="No records in this period" text="Pick a longer period, or log some waste records first.">
          {period.days && (
            <button type="button" className={buttonClass('secondary')} onClick={() => setPeriod('all')}>
              <History size={15} strokeWidth={2} /> Show all time
            </button>
          )}
          <Link to="/records" className={buttonClass('primary')}>
            <ClipboardPlus size={15} strokeWidth={2} /> Add records
          </Link>
        </EmptyCard>
      ) : (
        <div className={`grid gap-4 transition-opacity lg:gap-6 ${loading && data ? 'opacity-60' : ''}`} aria-busy={loading}>
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
            <KpiCard label="Recycling rate" icon={Leaf} color={colors.accent} value={s?.recycling_rate} unit="%"
              delta={period.days ? (hasPrev ? s.recycling_rate - p.recycling_rate : null) : undefined} deltaUnit=" pts" goodWhen="up"
              spark={spark} sparkKey="recycling_rate" caption={caption} />
            <KpiCard label="Kept out of landfill" icon={Recycle} color={colors.primary} value={diverted} unit="kg"
              delta={s && delta(diverted, p && p.recycled_kg + p.composted_kg)} goodWhen="up"
              spark={spark} sparkKey="diverted_kg" caption={caption} />
            <KpiCard label="Landfill" icon={Mountain} color={colors.warning} value={s?.landfill_kg} unit="kg"
              delta={s && delta(s.landfill_kg, p?.landfill_kg)} goodWhen="down"
              spark={spark} sparkKey="landfill_kg" caption={caption} />
            <KpiCard label="Total waste" icon={Trash2} color={colors.text} value={s?.total_kg} unit="kg"
              delta={s && delta(s.total_kg, p?.total_kg)} goodWhen="down"
              spark={spark} sparkKey="total_kg" caption={caption} />
          </div>

          <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
            <RecyclingTrendChart trend={data?.trend} className="xl:col-span-2" />
            <BestWorstCard best={data?.analytics.best_building} worst={data?.analytics.worst_building} loading={!data} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <BuildingRanking buildings={data?.buildings} campusRate={s?.recycling_rate} />
            <HostelVsAcademic buildings={data?.buildings} />
          </div>

          <InsightsCard insights={data?.analytics.insights} limit={5} title="All insights" showLink={false} />
        </div>
      )}
    </motion.div>
  )
}
