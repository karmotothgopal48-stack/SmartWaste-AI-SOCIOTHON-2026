import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getBuildingStats,
  getCategoryStats,
  getDailyStats,
  getRecyclingAnalytics,
  getSummary,
  getWeeklyStats,
} from '../services/api'
import { addDays } from '../lib/format'
import { notifyError } from '../lib/notify'
import { useReloadOnReconnect } from './useBackendStatus'

const PERIOD_DAYS = 30

/**
 * Loads everything the dashboard needs in two waves. The daily series tells us the
 * latest data date, which then anchors the 30-day period (and the previous one) for
 * the KPIs, categories and buildings. Each piece appears as soon as it arrives.
 */
export function useDashboardData() {
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    const stale = () => id !== requestId.current
    setData({})
    setError(null)

    try {
      const [daily, weekly, analytics] = await Promise.all([
        getDailyStats({ days: PERIOD_DAYS }),
        getWeeklyStats({ weeks: 12 }),
        getRecyclingAnalytics(),
      ])
      if (stale()) return
      const end = daily.at(-1)?.date
      const start = daily[0]?.date
      setData((d) => ({ ...d, daily, weekly, analytics, period: { start, end, days: PERIOD_DAYS } }))
      if (!start) return

      const range = { start_date: start, end_date: end }
      const [summary, prevSummary, categories, buildings] = await Promise.all([
        getSummary(range),
        getSummary({ start_date: addDays(start, -PERIOD_DAYS), end_date: addDays(start, -1) }),
        getCategoryStats(range),
        getBuildingStats(range),
      ])
      if (stale()) return
      setData((d) => ({ ...d, summary, prevSummary, categories, buildings }))
    } catch (err) {
      if (stale()) return
      setError(err)
      notifyError(err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useReloadOnReconnect(load)

  return { data, error, reload: load }
}
