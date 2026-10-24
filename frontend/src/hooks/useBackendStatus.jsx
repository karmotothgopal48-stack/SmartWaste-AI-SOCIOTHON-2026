import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { NETWORK_ERROR_EVENT, USE_MOCK, health } from '../services/api'

const POLL_ONLINE_MS = 30_000
const POLL_OFFLINE_MS = 5_000

const BackendStatusContext = createContext({ status: 'checking', records: null, check: () => {} })

/**
 * Tracks whether the API is reachable via /api/health.
 * status: 'mock' | 'checking' | 'online' | 'offline'. Polls faster while offline,
 * re-checks on window focus and immediately after any failed request.
 */
export function BackendStatusProvider({ children }) {
  const [state, setState] = useState({ status: USE_MOCK ? 'mock' : 'checking', records: null, version: null })
  const inFlight = useRef(false)

  const check = useCallback(async () => {
    if (USE_MOCK || inFlight.current) return
    inFlight.current = true
    try {
      const h = await health()
      setState({ status: 'online', records: h.records ?? h.record_count, version: h.version })
    } catch {
      setState((s) => ({ ...s, status: 'offline' }))
    } finally {
      inFlight.current = false
    }
  }, [])

  // Poll: fast while offline so the banner clears soon after the server starts.
  useEffect(() => {
    if (USE_MOCK) return
    check()
    const id = setInterval(check, state.status === 'offline' ? POLL_OFFLINE_MS : POLL_ONLINE_MS)
    return () => clearInterval(id)
  }, [check, state.status])

  useEffect(() => {
    if (USE_MOCK) return
    window.addEventListener('focus', check)
    window.addEventListener(NETWORK_ERROR_EVENT, check)
    return () => {
      window.removeEventListener('focus', check)
      window.removeEventListener(NETWORK_ERROR_EVENT, check)
    }
  }, [check])

  // Tell the user when the connection comes back.
  const previous = useRef(state.status)
  useEffect(() => {
    if (previous.current === 'offline' && state.status === 'online') {
      toast.dismiss('network-error')
      toast.success('Backend connected', { id: 'backend-status' })
    }
    previous.current = state.status
  }, [state.status])

  return <BackendStatusContext.Provider value={{ ...state, check }}>{children}</BackendStatusContext.Provider>
}

export const useBackendStatus = () => useContext(BackendStatusContext)

/** Calls `reload` when the backend comes back online after being offline. */
export function useReloadOnReconnect(reload) {
  const { status } = useBackendStatus()
  const previous = useRef(status)
  useEffect(() => {
    if (previous.current === 'offline' && status === 'online') reload()
    previous.current = status
  }, [status, reload])
}
