import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { TooltipCard } from '../ui/ChartTooltip'
import { categoryColors } from '../../lib/theme'
import { capitalize, fmtNumber } from '../../lib/format'
import { useCountUp } from '../../hooks/useCountUp'

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length || !payload[0].payload?.category) return null
  const c = payload[0].payload
  return (
    <TooltipCard
      title={capitalize(c.category)}
      rows={[
        { color: categoryColors[c.category], label: 'Weight', value: c.total_kg, unit: 'kg' },
        { label: 'Share', value: c.percent, unit: '%', strong: true },
      ]}
    />
  )
}

export default function CategoryDonut({ data, className = '' }) {
  const total = data?.reduce((s, c) => s + c.total_kg, 0)
  const shown = useCountUp(total)

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader icon={PieIcon} title="Category mix" subtitle="Last 30 days · by weight" />
      {!data ? (
        <div className="mt-6 flex flex-1 flex-col items-center gap-6">
          <Skeleton className="h-44 w-44 rounded-full" />
          <div className="w-full space-y-2.5">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        </div>
      ) : (
        <>
          <div
            className="relative mx-auto mt-4 h-[200px] w-full max-w-[220px]"
            role="figure"
            aria-label={`Donut chart of waste by category: ${data.map((c) => `${c.category} ${fmtNumber(c.percent)}%`).join(', ')}.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                {total === 0 && (
                  // Empty track so a period with no waste still shows a ring.
                  <Pie data={[{ v: 1 }]} dataKey="v" innerRadius="70%" outerRadius="100%" fill="rgba(255,255,255,0.06)" stroke="none" isAnimationActive={false} />
                )}
                <Tooltip content={<CategoryTooltip />} />
                <Pie
                  data={data}
                  dataKey="total_kg"
                  nameKey="category"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="none"
                  animationDuration={900}
                >
                  {data.map((c) => (
                    <Cell key={c.category} fill={categoryColors[c.category]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="label-caps text-micro">Total</div>
              <div className="mt-1 font-mono text-[24px] font-bold leading-none tabular-nums text-ink">
                {fmtNumber(shown / 1000, 2)}
                <span className="ml-0.5 text-small font-medium text-ink-muted">t</span>
              </div>
              <div className="mt-1 text-micro text-ink-faint">{fmtNumber(total, 0)} kg</div>
            </div>
          </div>

          <ul className="mt-5 space-y-1">
            {data.map((c) => (
              <li key={c.category} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-small hover:bg-white/[0.03]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: categoryColors[c.category] }} aria-hidden="true" />
                <span className="flex-1 font-medium text-ink">{capitalize(c.category)}</span>
                <span className="font-mono text-caption tabular-nums text-ink-muted">{fmtNumber(c.total_kg, 0)} kg</span>
                <span className="w-12 text-right font-mono text-caption font-bold tabular-nums text-ink">{fmtNumber(c.percent)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
