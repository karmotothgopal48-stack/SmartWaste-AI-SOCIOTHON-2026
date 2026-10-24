import { useCallback, useEffect, useRef, useState } from 'react'
import { notifyError } from '../lib/notify'
import { useReloadOnReconnect } from './useBackendStatus'

/**
 * Runs `fetcher()` whenever `deps` change. Returns { data, error, loading, reload }.
 * Keeps the previous data while reloading (no flash), toasts errors once,
 * ignores stale responses, and reloads automatically when the backend reconnects.
 */
export function useApi(fetcher, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const requestId = useRef(0)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const id = ++requestId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher()
      .then((data) => id === requestId.current && setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (id !== requestId.current) return
        setState((s) => ({ ...s, error, loading: false }))
        notifyError(error)
      })
  }, [...deps, version]) // eslint-disable-line react-hooks/exhaustive-deps

  useReloadOnReconnect(reload)
  return { ...state, reload }
}
