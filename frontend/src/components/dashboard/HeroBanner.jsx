import { Building2, Leaf, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import RecyclingRing from './RecyclingRing'
import HeroIllustration from './HeroIllustration'
import { fmtNumber, fmtShortDate } from '../../lib/format'

function HeroStat({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hair bg-surface-2/50 px-3.5 py-2.5">
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-micro font-medium text-ink-faint">{label}</div>
        <div className="truncate text-small font-semibold text-ink">{children}</div>
      </div>
    </div>
  )
}

export default function HeroBanner({ summary, prevSummary, analytics, period }) {
  const rateDelta = summary && prevSummary?.record_count ? summary.recycling_rate - prevSummary.recycling_rate : null
  const diverted = summary ? summary.recycled_kg + summary.composted_kg : null
  const best = analytics?.best_building

  return (
    <motion.section variants={fadeUp} className="glass edge-glow relative overflow-hidden">
      {/* inner ambience */}
      <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-accent/[0.07] blur-3xl" aria-hidden="true" />

      <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-10">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-caption font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
            {period?.start ? `${fmtShortDate(period.start)} – ${fmtShortDate(period.end)} · 7 buildings` : 'Loading period…'}
          </div>
          <h2 className="mt-4 font-display text-[30px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[40px] xl:text-[46px]">
            Campus Waste{' '}
            <span className="bg-linear-to-r from-accent via-primary to-teal-400 bg-clip-text text-transparent">Intelligence</span>
          </h2>
          <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-muted sm:text-[15px]">
            Every bin weigh-in across hostels and academic blocks, turned into one live picture of what we throw away and
            what we save.
          </p>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            <HeroStat icon={Leaf} label="Kept out of landfill">
              {diverted == null ? <Skeleton className="mt-1 h-4 w-20" /> : <span className="font-mono">{fmtNumber(diverted, 0)} kg</span>}
            </HeroStat>
            <HeroStat icon={Trophy} label="Top recycler">
              {analytics ? (best ? `${best.building} · ${fmtNumber(best.recycling_rate)}%` : '—') : <Skeleton className="mt-1 h-4 w-24" />}
            </HeroStat>
            <HeroStat icon={Building2} label="Records logged">
              {summary ? <span className="font-mono">{summary.record_count.toLocaleString('en-US')}</span> : <Skeleton className="mt-1 h-4 w-14" />}
            </HeroStat>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-6">
          <RecyclingRing rate={summary?.recycling_rate} delta={rateDelta} />
          <HeroIllustration className="hidden h-auto w-52 sm:block xl:w-60" />
        </div>
      </div>
    </motion.section>
  )
}
