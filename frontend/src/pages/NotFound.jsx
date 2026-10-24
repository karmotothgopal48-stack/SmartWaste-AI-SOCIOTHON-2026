import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, LayoutDashboard } from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { EmptyBinIllustration } from '../components/records/EmptyState'
import { easeOutExpo } from '../lib/theme'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className="glass edge-glow relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden px-6 py-14 text-center"
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="bg-linear-to-b from-ink/90 to-ink/10 bg-clip-text font-mono text-[88px] leading-none font-bold tracking-tighter text-transparent select-none sm:text-[120px]" aria-hidden="true">
          404
        </div>
        <EmptyBinIllustration className="absolute -right-10 -bottom-6 h-20 w-auto sm:-right-14 sm:h-24" />
      </div>
      <h2 className="mt-8 font-display text-heading font-semibold tracking-tight text-ink sm:text-[22px]">
        This page went to landfill
      </h2>
      <p className="mt-2 max-w-md text-body text-ink-muted">
        We couldn't find{' '}
        <code className="rounded-md border border-hair bg-surface-2 px-1.5 py-0.5 font-mono text-caption break-all text-ink">{pathname}</code>
        . The link may be mistyped, or the page has moved.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonClass('primary')}>
          <LayoutDashboard size={15} strokeWidth={2} /> Back to dashboard
        </Link>
        <Link to="/records" className={buttonClass('secondary')}>
          <ClipboardList size={15} strokeWidth={2} /> View records
        </Link>
      </div>
    </motion.section>
  )
}
