import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSummary, listRecords } from '../services/api'
import { notifyError } from '../lib/notify'
import { useReloadOnReconnect } from './useBackendStatus'

const FILTER_KEYS = ['start_date', 'end_date', 'building', 'category']
// Summary defaults to the last 30 days; this start date asks for all time instead (see API_CONTRACT §3).
const ALL_TIME_START = '1970-01-01'

/** Records list + summary, with filters and page kept in the URL so views are shareable. */
export function useRecords({ pageSize = 10 } = {}) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])),
    [params],
  )
  const page = Math.max(1, Number(params.get('page')) || 1)
  const rangeInvalid = Boolean(filters.start_date && filters.end_date && filters.start_date > filters.end_date)
  const hasFilters = FILTER_KEYS.some((k) => filters[k])

  const [list, setList] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    if (rangeInvalid) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))

    Promise.all([
      listRecords({ ...active, page, page_size: pageSize }),
      getSummary({ ...active, start_date: active.start_date || ALL_TIME_START }),
    ])
      .then(([listRes, summaryRes]) => {
        if (cancelled) return
        setList(listRes)
        setSummary(summaryRes)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        notifyError(err)
      })
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [filterKey, page, pageSize, version, rangeInvalid]) // eslint-disable-line react-hooks/exhaustive-deps

  // setSearchParams' updater gets the last *rendered* params, so two quick changes
  // (e.g. From then To) would drop the first. Build each update on a synchronously kept copy.
  const latest = useRef(params.toString())
  latest.current = params.toString()

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(latest.current)
      for (const [k, v] of Object.entries(changes)) {
        if (v === '' || v == null || (k === 'page' && Number(v) === 1)) next.delete(k)
        else next.set(k, String(v))
      }
      latest.current = next.toString()
      setParams(next, { replace: true })
    },
    [setParams],
  )

  const setFilter = useCallback((key, value) => update({ [key]: value, page: 1 }), [update])
  const setPage = useCallback((p) => update({ page: p }), [update])
  const reset = useCallback(() => {
    latest.current = ''
    setParams({}, { replace: true })
  }, [setParams])
  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  useReloadOnReconnect(refresh)

  // If a delete empties the last page, step back one page.
  useEffect(() => {
    if (list && !loading && list.items.length === 0 && list.total > 0 && page > 1) {
      setPage(Math.max(1, Math.ceil(list.total / pageSize)))
    }
  }, [list, loading, page, pageSize, setPage])

  return { filters, page, pageSize, list, summary, loading, error, rangeInvalid, hasFilters, setFilter, setPage, reset, refresh }
}
