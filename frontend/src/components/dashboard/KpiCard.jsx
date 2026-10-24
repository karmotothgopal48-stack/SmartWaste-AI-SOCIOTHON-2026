import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { Card } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import DeltaBadge from '../ui/DeltaBadge'
import { useCountUp } from '../../hooks/useCountUp'
import { fmtNumber } from '../../lib/format'

function Sparkline({ data, dataKey, color }) {
  const id = useId()
  return (
    <div className="h-11 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${id}-spark`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.35} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id}-spark)`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * value: number | undefined (undefined = loading)
 * unit: 'kg' | '%'; delta: number | null; deltaUnit: '%' | ' pts'
 */
export default function KpiCard({ label, icon: Icon, color, value, unit, delta, deltaUnit = '%', goodWhen, spark, sparkKey, caption }) {
  const shown = useCountUp(value)
  const loading = value == null

  return (
    <Card innerClassName="flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border"
            style={{
              color,
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
              borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
              boxShadow: `0 0 18px -4px color-mix(in srgb, ${color} 55%, transparent)`,
            }}
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className="label-caps text-micro">{label}</div>
        </div>
        {loading ? <Skeleton className="h-5 w-14 rounded-full" /> : delta !== undefined && <DeltaBadge value={delta} unit={deltaUnit} goodWhen={goodWhen} />}
      </div>

      <div className="mt-5 min-h-[44px]">
        {loading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <div className="font-mono text-[32px] font-bold leading-none tracking-tight tabular-nums text-ink sm:text-[36px]">
            {fmtNumber(shown)}
            <span className="ml-1 text-title font-medium text-ink-muted sm:text-heading">{unit}</span>
          </div>
        )}
      </div>
      <div className="mt-1.5 text-caption text-ink-faint">{caption}</div>

      <div className="mt-3 -mx-1">
        {spark ? <Sparkline data={spark} dataKey={sparkKey} color={color} /> : <Skeleton className="h-11 w-full" />}
      </div>
    </Card>
  )
}
