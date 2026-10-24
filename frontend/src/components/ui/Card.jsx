import { motion } from 'framer-motion'
import { easeOutExpo } from '../../lib/theme'

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
}

/**
 * Glass card with a staggered entrance. Motion lives on the wrapper so the CSS
 * hover lift on the inner surface isn't overridden by Framer's inline transform.
 */
export function Card({ className = '', innerClassName = '', hover = true, featured = false, children }) {
  return (
    <motion.div variants={fadeUp} className={`min-w-0 ${className}`}>
      <section
        className={`glass h-full ${hover ? 'glass-hover' : ''} ${featured ? 'edge-glow' : ''} ${innerClassName}`}
      >
        {children}
      </section>
    </motion.div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-hair bg-surface-2 text-ink-muted">
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-title font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function LegendItem({ color, label, dashed = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-muted">
      <span
        className="h-2 w-2 rounded-full"
        style={dashed ? { border: `1.5px dashed ${color}` } : { background: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
