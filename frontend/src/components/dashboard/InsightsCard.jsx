import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Lightbulb, Recycle, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { colors } from '../../lib/theme'

// Pick an icon + tone from the wording of the generated insight.
function toneFor(text) {
  const t = text.toLowerCase()
  if (t.includes('highest')) return { icon: Trophy, color: colors.accent }
  if (t.includes('lowest') || t.includes('dropped')) return { icon: AlertTriangle, color: colors.warning }
  if (t.includes('rose')) return { icon: TrendingUp, color: colors.danger }
  if (t.includes('fell') || t.includes('improved')) return { icon: TrendingDown, color: colors.accent }
  if (t.includes('diverted')) return { icon: Recycle, color: colors.primary }
  return { icon: Lightbulb, color: colors.primary }
}

export default function InsightsCard({ insights, className = '', limit = 3, title = 'Top insights', showLink = true }) {
  const top = insights?.slice(0, limit)

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6" featured>
      <CardHeader
        icon={Lightbulb}
        title={title}
        subtitle="Generated automatically from the data"
      />

      <ul className="mt-5 flex-1 space-y-3">
        {!top
          ? Array.from({ length: limit }, (_, i) => (
              <li key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </li>
            ))
          : top.length === 0
            ? <li className="py-8 text-center text-small text-ink-muted">Not enough data yet to spot patterns.</li>
            : top.map((text) => {
                const { icon: Icon, color } = toneFor(text)
                return (
                  <li key={text} className="flex gap-3 rounded-xl border border-hair bg-surface-2/40 p-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <p className="pt-0.5 text-small leading-relaxed text-ink">{text}</p>
                  </li>
                )
              })}
      </ul>

      {showLink && (
      <Link
        to="/analytics"
        className="group mt-4 inline-flex items-center gap-1.5 self-start text-small font-semibold text-primary hover:text-accent"
      >
        All recycling analytics
        <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
      )}
    </Card>
  )
}
