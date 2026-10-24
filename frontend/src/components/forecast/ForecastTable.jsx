import { CalendarDays } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { addDays, fmtNumber } from '../../lib/format'

const weekday = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' })
const dayMonth = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export default function ForecastTable({ data, className = '' }) {
  const actualByDate = Object.fromEntries((data?.history ?? []).map((h) => [h.date, h.actual_kg]))

  return (
    <Card className={className} innerClassName="flex flex-col p-5 sm:p-6">
      <CardHeader icon={CalendarDays} title="Day by day" subtitle="Estimate, likely range, and change vs the same weekday last week" />
      <table className="mt-4 w-full text-left">
        <caption className="sr-only">Forecast per day with likely range and change versus the same weekday last week</caption>
        <thead>
          <tr className="border-b border-hair text-micro font-semibold tracking-[0.1em] text-ink-muted uppercase">
            <th scope="col" className="py-2 pr-2">Day</th>
            <th scope="col" className="px-2 py-2 text-right">Estimate</th>
            <th scope="col" className="py-2 pl-2 text-right"><abbr title="Change vs the same weekday last week" className="no-underline">vs last wk</abbr></th>
          </tr>
        </thead>
        <tbody>
          {!data
            ? Array.from({ length: 7 }, (_, i) => (
                <tr key={i}><td colSpan={3} className="py-2"><Skeleton className="h-8 w-full" /></td></tr>
              ))
            : data.forecast.map((f) => {
                const lastWeek = actualByDate[addDays(f.date, -7)]
                const diff = lastWeek ? ((f.predicted_kg - lastWeek) / lastWeek) * 100 : null
                return (
                  <tr key={f.date} className="border-b border-hair last:border-0">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <div className="text-small font-semibold text-ink">{weekday(f.date)}</div>
                      <div className="text-caption text-ink-faint">{dayMonth(f.date)}</div>
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                      <div className="font-mono text-small font-bold text-ink">
                        {fmtNumber(f.predicted_kg, 0)} <span className="font-normal text-ink-faint">kg</span>
                      </div>
                      <div className="font-mono text-micro text-ink-faint">{fmtNumber(f.lower, 0)}–{fmtNumber(f.upper, 0)}</div>
                    </td>
                    <td className="py-2 pl-2 text-right font-mono text-caption whitespace-nowrap tabular-nums text-ink-muted">
                      {diff == null ? '—' : `${diff >= 0 ? '+' : '−'}${fmtNumber(Math.abs(diff))}%`}
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
    </Card>
  )
}
