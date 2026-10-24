import { fmtNumber } from '../../lib/format'
import { colors } from '../../lib/theme'

/** Glass tooltip shell used by every chart. rows: [{ color, label, value, unit, strong }] */
export function TooltipCard({ title, rows, footer }) {
  return (
    <div className="pointer-events-none min-w-[180px] rounded-xl border border-strong bg-surface-2/95 px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mb-2 font-display text-caption font-semibold text-ink">{title}</div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-6 text-caption">
            <span className="flex items-center gap-2 text-ink-muted">
              {r.color ? (
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              ) : (
                <span className="h-2 w-2" />
              )}
              {r.label}
            </span>
            <span className={`font-mono tabular-nums ${r.strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
              {typeof r.value === 'number' ? fmtNumber(r.value, r.dp ?? 1) : r.value}
              {r.unit && <span className="ml-0.5 text-ink-faint">{r.unit}</span>}
            </span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-2 border-t border-hair pt-2 text-micro text-ink-faint">{footer}</div>}
    </div>
  )
}

export const axisProps = {
  tick: { fill: colors.textFaint, fontSize: 11, fontFamily: '"Plus Jakarta Sans", sans-serif' },
  axisLine: false,
  tickLine: false,
}

export const gridProps = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)', vertical: false }
