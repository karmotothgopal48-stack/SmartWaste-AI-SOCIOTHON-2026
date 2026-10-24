// One function per endpoint in docs/API_CONTRACT.md.
// USE_MOCK = true serves generated data in the browser (no backend needed, e.g. for UI work).
import * as mock from './mockData.js'
import { ApiError } from './apiError.js'

export const USE_MOCK = false

/** Set VITE_API_URL in frontend/.env.local to override (see .env.example). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
const TIMEOUT_MS = 20_000 // the first forecast call trains the model (~2 s); anything far longer is a hang

/** Fired on network failures so the backend-status provider can re-check immediately. */
export const NETWORK_ERROR_EVENT = 'smartwaste:network-error'

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.append(key, value)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

async function request(path, { method = 'GET', query, body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}${toQuery(query)}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    window.dispatchEvent(new Event(NETWORK_ERROR_EVENT))
    throw new ApiError(
      0,
      err?.name === 'AbortError'
        ? 'The API server took too long to respond.'
        : 'Backend offline: start the API server (uvicorn app.main:app --reload --port 8000).',
    )
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? `Request failed (${res.status})`, data?.errors ?? null)
  return data
}

/** Filters: { start_date, end_date, building, category } — all optional. */

export const health = () => (USE_MOCK ? mock.health() : request('/health'))

// Records
export const listRecords = (params = {}) =>
  USE_MOCK ? mock.listRecords(params) : request('/records', { query: params })

export const createRecord = (input) =>
  USE_MOCK ? mock.createRecord(input) : request('/records', { method: 'POST', body: input })

export const getRecord = (id) => (USE_MOCK ? mock.getRecord(id) : request(`/records/${id}`))

export const updateRecord = (id, input) =>
  USE_MOCK ? mock.updateRecord(id, input) : request(`/records/${id}`, { method: 'PUT', body: input })

export const deleteRecord = (id) =>
  USE_MOCK ? mock.deleteRecord(id) : request(`/records/${id}`, { method: 'DELETE' })

export const getBuildings = () => (USE_MOCK ? mock.getBuildings() : request('/buildings'))

// Stats
export const getSummary = (filters = {}) =>
  USE_MOCK ? mock.getSummary(filters) : request('/stats/summary', { query: filters })

export const getDailyStats = ({ days = 30, ...filters } = {}) =>
  USE_MOCK ? mock.getDailyStats({ days, ...filters }) : request('/stats/daily', { query: { days, ...filters } })

export const getWeeklyStats = ({ weeks = 12, ...filters } = {}) =>
  USE_MOCK ? mock.getWeeklyStats({ weeks, ...filters }) : request('/stats/weekly', { query: { weeks, ...filters } })

export const getBuildingStats = (filters = {}) =>
  USE_MOCK ? mock.getBuildingStats(filters) : request('/stats/buildings', { query: filters })

export const getCategoryStats = (filters = {}) =>
  USE_MOCK ? mock.getCategoryStats(filters) : request('/stats/categories', { query: filters })

// Analytics & ML
export const getRecyclingAnalytics = (filters = {}) =>
  USE_MOCK ? mock.getRecyclingAnalytics(filters) : request('/analytics/recycling', { query: filters })

export const getForecast = ({ days = 7 } = {}) =>
  USE_MOCK ? mock.getForecast({ days }) : request('/forecast', { query: { days } })

export { ApiError, getErrorMessage } from './apiError.js'
