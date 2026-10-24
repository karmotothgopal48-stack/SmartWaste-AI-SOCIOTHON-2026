import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardPlus, Inbox, Leaf, Mountain, Recycle, Trash2 } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { fadeUp, staggerContainer } from '../components/ui/Card'
import { ErrorCard } from '../components/ui/StatusCards'
import { buttonClass } from '../components/ui/Button'
import HeroBanner from '../components/dashboard/HeroBanner'
import KpiCard from '../components/dashboard/KpiCard'
import DailyWasteChart from '../components/dashboard/DailyWasteChart'
import WeeklyWasteChart from '../components/dashboard/WeeklyWasteChart'
import CategoryDonut from '../components/dashboard/CategoryDonut'
import BuildingComparison from '../components/dashboard/BuildingComparison'
import InsightsCard from '../components/dashboard/InsightsCard'
import { colors } from '../lib/theme'
import { pctChange } from '../lib/format'

/** Shown above the (all-zero) charts when the period has no records. */
function NoDataNotice() {
  return (
    <motion.div variants={fadeUp} className="glass flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/10 text-primary">
        <Inbox size={20} strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <h2 className="font-display text-title font-semibold text-ink">No waste records in the last 30 days</h2>
        <p className="mt-0.5 text-small text-ink-muted">The charts below fill in as soon as records are logged.</p>
      </div>
      <Link to="/records" className={buttonClass('primary')}>
        <ClipboardPlus size={15} strokeWidth={2} /> Add records
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const { data, error, reload } = useDashboardData()
  const { summary: s, prevSummary: p, daily } = data

  if (error) return <ErrorCard error={error} onRetry={reload} title="Couldn't load the dashboard" />

  const diverted = s && s.recycled_kg + s.composted_kg
  const prevDiverted = p && p.recycled_kg + p.composted_kg
  const hasPrev = p?.record_count > 0
  const spark = daily?.map((d) => ({ ...d, rate: d.total_kg > 0 ? (d.recycled_kg / d.total_kg) * 100 : 0 }))
  const caption = 'vs previous 30 days'

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 lg:gap-6">
      <HeroBanner summary={s} prevSummary={p} analytics={data.analytics} period={data.period} />
      {s?.record_count === 0 && <NoDataNotice />}

      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        <KpiCard
          label="Total waste"
          icon={Trash2}
          color={colors.text}
          value={s?.total_kg}
          unit="kg"
          delta={s?.change_vs_prev_period}
          goodWhen="down"
          spark={spark}
          sparkKey="total_kg"
          caption={caption}
        />
        <KpiCard
          label="Recycled + composted"
          icon={Recycle}
          color={colors.primary}
          value={diverted}
          unit="kg"
          delta={hasPrev ? pctChange(diverted, prevDiverted) : null}
          goodWhen="up"
          spark={spark}
          sparkKey="recycled_kg"
          caption={caption}
        />
        <KpiCard
          label="Landfill"
          icon={Mountain}
          color={colors.warning}
          value={s?.landfill_kg}
          unit="kg"
          delta={hasPrev ? pctChange(s.landfill_kg, p.landfill_kg) : null}
          goodWhen="down"
          spark={spark}
          sparkKey="landfill_kg"
          caption={caption}
        />
        <KpiCard
          label="Recycling rate"
          icon={Leaf}
          color={colors.accent}
          value={s?.recycling_rate}
          unit="%"
          delta={hasPrev ? s.recycling_rate - p.recycling_rate : null}
          deltaUnit=" pts"
          goodWhen="up"
          spark={spark}
          sparkKey="rate"
          caption={caption}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <DailyWasteChart data={daily} className="lg:col-span-2" />
        <CategoryDonut data={data.categories} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <WeeklyWasteChart data={data.weekly} latestDate={data.period?.end} className="lg:col-span-2" />
        <InsightsCard insights={data.analytics?.insights} />
      </div>

      <BuildingComparison data={data.buildings} />
    </motion.div>
  )
}
