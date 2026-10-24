// In-browser mock backend. Generates 90 days of realistic campus waste records and
// implements every endpoint in docs/API_CONTRACT.md against them, so the UI can be
// built before the FastAPI backend exists. Data is seeded, so it is the same on every reload.
import {
  BUILDINGS,
  BUILDING_NAMES,
  CATEGORIES,
  DISPOSALS,
  MAX_NOTES_LENGTH,
  MAX_WEIGHT_KG,
  buildingTypeOf,
} from '../lib/constants.js'
import { ApiError, validationError } from './apiError.js'

const DAYS_OF_DATA = 90
const MIN_FORECAST_DAYS = 21
const FORECAST_NOTE = 'Forecasts are estimates, not guaranteed values.'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n) => String(n).padStart(2, '0')
const parseISO = (s) => new Date(`${s}T00:00:00Z`)
const toISO = (d) => d.toISOString().slice(0, 10)
const addDays = (s, n) => {
  const d = parseISO(s)
  d.setUTCDate(d.getUTCDate() + n)
  return toISO(d)
}
const weekday = (s) => parseISO(s).getUTCDay() // 0 = Sunday
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000)
const mondayOf = (s) => addDays(s, -((weekday(s) + 6) % 7))
const isWeekend = (s) => weekday(s) === 0 || weekday(s) === 6
const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
const sum = (arr, fn = (x) => x) => arr.reduce((acc, x) => acc + fn(x), 0)
const fmtKg = (n) => Math.round(n).toLocaleString('en-US')

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const rate = (diverted, total) => (total > 0 ? round((diverted / total) * 100, 1) : 0)
const pctChange = (cur, prev) => (prev > 0 ? round(((cur - prev) / prev) * 100, 1) : null)

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

// Typical kg/day per category on a weekday.
const PROFILES = {
  'Hostel A':         { organic: 42, plastic: 14, paper: 6,  metal: 2.5, other: 7 },
  'Hostel B':         { organic: 48, plastic: 17, paper: 7,  metal: 3,   other: 8 },
  'Girls Hostel':     { organic: 34, plastic: 11, paper: 6,  metal: 2,   other: 5 },
  'Academic Block 1': { organic: 7,  plastic: 9,  paper: 19, metal: 1.5, other: 4 },
  'Academic Block 2': { organic: 6,  plastic: 8,  paper: 16, metal: 1.5, other: 3.5 },
  'Library':          { organic: 2,  plastic: 4,  paper: 14, metal: 0.8, other: 2 },
  'Admin Block':      { organic: 3,  plastic: 4,  paper: 9,  metal: 0.8, other: 2 },
}

// Weekend volume multiplier: hostels are busier, academic blocks mostly empty.
const WEEKEND_FACTOR = {
  'Hostel A': 1.08, 'Hostel B': 1.1, 'Girls Hostel': 1.05,
  'Academic Block 1': 0.3, 'Academic Block 2': 0.28, 'Library': 0.55, 'Admin Block': 0.15,
}

// How good each building is at segregation (added to the diversion probability).
const SEGREGATION_BONUS = {
  'Hostel A': -0.12, 'Hostel B': -0.04, 'Girls Hostel': 0.04,
  'Academic Block 1': 0.02, 'Academic Block 2': -0.02, 'Library': 0.1, 'Admin Block': 0.05,
}

// Share of each category that is diverted (recycled/composted) at the start → end of the period.
const DIVERSION = {
  organic: { start: 0.38, end: 0.62, method: 'composted' },
  plastic: { start: 0.42, end: 0.62, method: 'recycled' },
  paper:   { start: 0.58, end: 0.78, method: 'recycled' },
  metal:   { start: 0.78, end: 0.9,  method: 'recycled' },
  other:   { start: 0.06, end: 0.14, method: 'recycled' },
}

const NOTES = {
  organic: ['Mess kitchen waste', 'Canteen leftovers', 'Garden trimmings'],
  plastic: ['PET bottles', 'Food delivery packaging', 'Mixed wrappers'],
  paper: ['Printouts and notebooks', 'Cardboard boxes', 'Newspapers'],
  metal: ['Aluminium cans', 'Scrap from maintenance'],
  other: ['E-waste handed to vendor', 'Textiles', 'Unsegregated bag'],
}

function generateRecords() {
  const rand = mulberry32(2026)
  const end = todayISO()
  const start = addDays(end, -(DAYS_OF_DATA - 1))
  const records = []
  let id = 1

  for (let i = 0; i < DAYS_OF_DATA; i++) {
    const date = addDays(start, i)
    const progress = i / (DAYS_OF_DATA - 1)
    const growth = 1 + 0.0012 * i // mild upward trend in volume

    for (const building of BUILDING_NAMES) {
      const dayFactor = isWeekend(date) ? WEEKEND_FACTOR[building] : 1
      for (const category of CATEGORIES) {
        // Metal and "other" are not collected every day.
        if ((category === 'metal' || category === 'other') && rand() < 0.35) continue

        const noise = 0.78 + rand() * 0.44
        const weight = PROFILES[building][category] * dayFactor * growth * noise
        if (weight < 0.2) continue

        const d = DIVERSION[category]
        const share = Math.min(
          0.97,
          Math.max(0, d.start + (d.end - d.start) * progress + SEGREGATION_BONUS[building] + (rand() - 0.5) * 0.12),
        )
        const diverted = round(weight * share)
        const landfill = round(weight - diverted)
        const note = rand() < 0.12 ? NOTES[category][Math.floor(rand() * NOTES[category].length)] : null

        const base = { date, building, building_type: buildingTypeOf(building), category }
        if (diverted >= 0.1) {
          records.push({ id: id++, ...base, weight_kg: diverted, disposal: d.method, notes: note })
        }
        if (landfill >= 0.1) {
          records.push({ id: id++, ...base, weight_kg: landfill, disposal: 'landfill', notes: null })
        }
      }
    }
  }
  return records
}

let records = generateRecords()
let nextId = records.length + 1

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

const clone = (x) => structuredClone(x)
const latestDate = () => records.reduce((max, r) => (r.date > max ? r.date : max), records[0]?.date ?? todayISO())
const delay = () => new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 250))

function validateFilters({ start_date, end_date, category, building } = {}) {
  const errors = []
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime())
  if (start_date && !isDate(start_date)) errors.push(qErr('start_date', 'Input should be a valid date'))
  if (end_date && !isDate(end_date)) errors.push(qErr('end_date', 'Input should be a valid date'))
  if (start_date && end_date && start_date > end_date)
    errors.push(qErr('start_date', 'start_date must be on or before end_date'))
  if (category && !CATEGORIES.includes(category)) errors.push(qErr('category', 'Unknown category'))
  if (building && !BUILDING_NAMES.includes(building)) errors.push(qErr('building', 'Unknown building'))
  if (errors.length) throw validationError(errors)
}
const qErr = (field, msg) => ({ loc: ['query', field], msg, type: 'value_error' })

function filterRecords({ start_date, end_date, building, category } = {}) {
  return records.filter(
    (r) =>
      (!start_date || r.date >= start_date) &&
      (!end_date || r.date <= end_date) &&
      (!building || r.building === building) &&
      (!category || r.category === category),
  )
}

function totals(list) {
  const by = { recycled: 0, composted: 0, landfill: 0 }
  for (const r of list) by[r.disposal] += r.weight_kg
  const total = by.recycled + by.composted + by.landfill
  return { total, recycled: by.recycled, composted: by.composted, landfill: by.landfill, diverted: by.recycled + by.composted }
}

function dailySeries(list, start, end) {
  const map = new Map()
  for (let d = start; d <= end; d = addDays(d, 1)) map.set(d, [])
  for (const r of list) map.get(r.date)?.push(r)
  return [...map.entries()].map(([date, rs]) => ({ date, ...totals(rs) }))
}

function weeklySeries(list, weeks, end) {
  const lastMonday = mondayOf(end)
  const firstMonday = addDays(lastMonday, -7 * (weeks - 1))
  const map = new Map()
  for (let w = 0; w < weeks; w++) map.set(addDays(firstMonday, 7 * w), [])
  for (const r of list) map.get(mondayOf(r.date))?.push(r)
  return [...map.entries()].map(([week_start, rs]) => ({ week_start, ...totals(rs) }))
}

function validateInput(input) {
  const errors = []
  const err = (field, msg, type = 'value_error') => errors.push({ loc: ['body', field], msg, type })
  const data = input ?? {}

  if (!data.date) err('date', 'Field required', 'missing')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(parseISO(data.date).getTime()))
    err('date', 'Input should be a valid date (YYYY-MM-DD)')
  else if (data.date > todayISO()) err('date', 'Date cannot be in the future')

  if (!data.building) err('building', 'Field required', 'missing')
  else if (!BUILDING_NAMES.includes(data.building)) err('building', 'Unknown building')

  if (!data.category) err('category', 'Field required', 'missing')
  else if (!CATEGORIES.includes(data.category)) err('category', `Input should be ${CATEGORIES.join(', ')}`)

  const weight = Number(data.weight_kg)
  if (data.weight_kg === undefined || data.weight_kg === null || data.weight_kg === '')
    err('weight_kg', 'Field required', 'missing')
  else if (!Number.isFinite(weight)) err('weight_kg', 'Input should be a valid number')
  else if (weight <= 0) err('weight_kg', 'Input should be greater than 0', 'greater_than')
  else if (weight > MAX_WEIGHT_KG) err('weight_kg', `Input should be less than or equal to ${MAX_WEIGHT_KG}`)

  if (!data.disposal) err('disposal', 'Field required', 'missing')
  else if (!DISPOSALS.includes(data.disposal)) err('disposal', `Input should be ${DISPOSALS.join(', ')}`)

  if (data.notes && String(data.notes).length > MAX_NOTES_LENGTH)
    err('notes', `String should have at most ${MAX_NOTES_LENGTH} characters`)

  if (errors.length) throw validationError(errors)

  return {
    date: data.date,
    building: data.building,
    building_type: buildingTypeOf(data.building),
    category: data.category,
    weight_kg: round(weight),
    disposal: data.disposal,
    notes: data.notes ? String(data.notes).trim() || null : null,
  }
}

function findIndex(id) {
  const idx = records.findIndex((r) => r.id === Number(id))
  if (idx === -1) throw new ApiError(404, `Record ${id} not found`)
  return idx
}

// ---------------------------------------------------------------------------
// Endpoints (same names and shapes as src/services/api.js)
// ---------------------------------------------------------------------------

export async function health() {
  await delay()
  return { status: 'ok', version: '1.0.0-mock', record_count: records.length }
}

export async function listRecords({ page = 1, page_size = 20, ...filters } = {}) {
  await delay()
  validateFilters(filters)
  page = Math.max(1, Number(page) || 1)
  page_size = Math.min(100, Math.max(1, Number(page_size) || 20))
  const list = filterRecords(filters).sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  const startIdx = (page - 1) * page_size
  return { items: clone(list.slice(startIdx, startIdx + page_size)), total: list.length, page, page_size }
}

export async function createRecord(input) {
  await delay()
  const record = { id: nextId++, ...validateInput(input) }
  records.push(record)
  return clone(record)
}

export async function getRecord(id) {
  await delay()
  return clone(records[findIndex(id)])
}

export async function updateRecord(id, input) {
  await delay()
  const idx = findIndex(id)
  records[idx] = { id: records[idx].id, ...validateInput(input) }
  return clone(records[idx])
}

export async function deleteRecord(id) {
  await delay()
  records.splice(findIndex(id), 1)
  return null
}

export async function getBuildings() {
  await delay()
  return clone(BUILDINGS)
}

export async function getSummary(filters = {}) {
  await delay()
  validateFilters(filters)
  let { start_date, end_date } = filters
  if (!end_date) end_date = latestDate()
  if (!start_date) start_date = addDays(end_date, -29)

  const length = daysBetween(start_date, end_date) + 1
  const prevEnd = addDays(start_date, -1)
  const prevStart = addDays(prevEnd, -(length - 1))

  const cur = filterRecords({ ...filters, start_date, end_date })
  const prev = filterRecords({ ...filters, start_date: prevStart, end_date: prevEnd })
  const t = totals(cur)
  const p = totals(prev)

  return {
    total_kg: round(t.total),
    recycled_kg: round(t.recycled),
    composted_kg: round(t.composted),
    landfill_kg: round(t.landfill),
    recycling_rate: rate(t.diverted, t.total),
    record_count: cur.length,
    change_vs_prev_period: prev.length ? pctChange(t.total, p.total) : null,
  }
}

export async function getDailyStats({ days = 30, ...filters } = {}) {
  await delay()
  validateFilters(filters)
  days = Math.min(365, Math.max(1, Number(days) || 30))
  const end = filters.end_date || latestDate()
  const start = filters.start_date || addDays(end, -(days - 1))
  return dailySeries(filterRecords({ ...filters, start_date: start, end_date: end }), start, end).map((d) => ({
    date: d.date,
    total_kg: round(d.total),
    recycled_kg: round(d.diverted),
    landfill_kg: round(d.landfill),
  }))
}

export async function getWeeklyStats({ weeks = 12, ...filters } = {}) {
  await delay()
  validateFilters(filters)
  weeks = Math.min(104, Math.max(1, Number(weeks) || 12))
  const end = filters.end_date || latestDate()
  return weeklySeries(filterRecords(filters), weeks, end).map((w) => ({
    week_start: w.week_start,
    total_kg: round(w.total),
    recycled_kg: round(w.diverted),
    landfill_kg: round(w.landfill),
  }))
}

export async function getBuildingStats(filters = {}) {
  await delay()
  validateFilters(filters)
  const list = filterRecords(filters)
  return BUILDINGS.map(({ building, building_type }) => {
    const t = totals(list.filter((r) => r.building === building))
    return {
      building,
      building_type,
      total_kg: round(t.total),
      recycled_kg: round(t.diverted),
      landfill_kg: round(t.landfill),
      recycling_rate: rate(t.diverted, t.total),
    }
  }).sort((a, b) => b.total_kg - a.total_kg)
}

export async function getCategoryStats(filters = {}) {
  await delay()
  validateFilters(filters)
  const list = filterRecords(filters)
  const grand = sum(list, (r) => r.weight_kg)
  return CATEGORIES.map((category) => {
    const total = sum(list.filter((r) => r.category === category), (r) => r.weight_kg)
    return { category, total_kg: round(total), percent: grand > 0 ? round((total / grand) * 100, 1) : 0 }
  }).sort((a, b) => b.total_kg - a.total_kg)
}

export async function getRecyclingAnalytics(filters = {}) {
  await delay()
  validateFilters(filters)
  const list = filterRecords(filters)
  const end = filters.end_date || latestDate()

  const trend = weeklySeries(list, 12, end).map((w) => ({
    week_start: w.week_start,
    recycling_rate: rate(w.diverted, w.total),
    total_kg: round(w.total),
    diverted_kg: round(w.diverted),
  }))

  const ranked = BUILDINGS.map(({ building, building_type }) => {
    const t = totals(list.filter((r) => r.building === building))
    return { building, building_type, recycling_rate: rate(t.diverted, t.total), total: t.total }
  }).filter((b) => b.total > 0)
  ranked.sort((a, b) => b.recycling_rate - a.recycling_rate)
  const strip = (b) => (b ? { building: b.building, building_type: b.building_type, recycling_rate: b.recycling_rate } : null)

  return {
    trend,
    best_building: strip(ranked[0]),
    worst_building: strip(ranked[ranked.length - 1]),
    insights: list.length ? buildInsights(list, ranked, end) : [],
  }
}

function buildInsights(list, ranked, end) {
  const insights = []
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  if (best) insights.push(`${best.building} recycles ${best.recycling_rate}% of its waste, the highest on campus.`)
  if (worst && worst !== best)
    insights.push(`${worst.building} has the lowest recycling rate (${worst.recycling_rate}%). Better segregation bins there would have the biggest impact.`)

  // Biggest week-over-week jump for a building × category pair.
  const thisWeek = list.filter((r) => r.date > addDays(end, -7) && r.date <= end)
  const lastWeek = list.filter((r) => r.date > addDays(end, -14) && r.date <= addDays(end, -7))
  let jump = null
  for (const building of BUILDING_NAMES) {
    for (const category of CATEGORIES) {
      const match = (r) => r.building === building && r.category === category
      const cur = sum(thisWeek.filter(match), (r) => r.weight_kg)
      const prev = sum(lastWeek.filter(match), (r) => r.weight_kg)
      if (prev < 15) continue
      const change = ((cur - prev) / prev) * 100
      if (!jump || Math.abs(change) > Math.abs(jump.change)) jump = { building, category, change }
    }
  }
  if (jump && Math.abs(jump.change) >= 5) {
    const label = jump.category[0].toUpperCase() + jump.category.slice(1)
    insights.push(
      `${label} waste from ${jump.building} ${jump.change > 0 ? 'rose' : 'fell'} ${Math.abs(Math.round(jump.change))}% compared with last week.`,
    )
  }

  const last30 = totals(list.filter((r) => r.date > addDays(end, -30) && r.date <= end))
  if (last30.diverted > 0) insights.push(`Campus diverted ${fmtKg(last30.diverted)} kg from landfill in the last 30 days.`)

  const recent = totals(list.filter((r) => r.date > addDays(end, -28)))
  const earlier = totals(list.filter((r) => r.date > addDays(end, -56) && r.date <= addDays(end, -28)))
  if (recent.total > 0 && earlier.total > 0) {
    const delta = round(rate(recent.diverted, recent.total) - rate(earlier.diverted, earlier.total), 1)
    if (Math.abs(delta) >= 0.5)
      insights.push(`The recycling rate ${delta > 0 ? 'improved' : 'dropped'} by ${Math.abs(delta)} points over the last 4 weeks.`)
  }

  const perBuilding = (type) => {
    const names = BUILDINGS.filter((b) => b.building_type === type).map((b) => b.building)
    return sum(list.filter((r) => names.includes(r.building)), (r) => r.weight_kg) / names.length
  }
  const hostel = perBuilding('hostel')
  const academic = perBuilding('academic')
  if (hostel > 0 && academic > 0)
    insights.push(`An average hostel produces ${(hostel / academic).toFixed(1)}× the waste of an average academic building, mostly organic mess waste.`)

  return insights.slice(0, 6)
}

// Forecast: weekday-seasonal linear trend. y ≈ (a + b·t) × weekdayFactor
function fitSeasonalTrend(series) {
  const mean = sum(series, (d) => d.y) / series.length
  const factors = Array.from({ length: 7 }, (_, dow) => {
    const ys = series.filter((d) => weekday(d.date) === dow).map((d) => d.y)
    return ys.length && mean > 0 ? sum(ys) / ys.length / mean : 1
  })
  const pts = series.map((d, t) => ({ t, y: d.y / factors[weekday(d.date)] }))
  const n = pts.length
  const mt = sum(pts, (p) => p.t) / n
  const my = sum(pts, (p) => p.y) / n
  const sxx = sum(pts, (p) => (p.t - mt) ** 2)
  const b = sxx > 0 ? sum(pts, (p) => (p.t - mt) * (p.y - my)) / sxx : 0
  const a = my - b * mt
  return (t, date) => Math.max(0, (a + b * t) * factors[weekday(date)])
}

export async function getForecast({ days = 7 } = {}) {
  await delay()
  days = Math.min(14, Math.max(1, Number(days) || 7))
  const end = latestDate()
  const first = records.reduce((min, r) => (r.date < min ? r.date : min), end)
  const series = dailySeries(records, first, end).map((d) => ({ date: d.date, y: d.total }))
  const history = series.slice(-30).map((d) => ({ date: d.date, actual_kg: round(d.y) }))
  const daysWithData = series.filter((d) => d.y > 0).length

  if (daysWithData < MIN_FORECAST_DAYS) {
    return {
      history,
      forecast: [],
      model: null,
      metrics: { mae: null, baseline_mae: null, holdout_days: null },
      note: `${FORECAST_NOTE} Not enough data to forecast yet: at least ${MIN_FORECAST_DAYS} days of records are needed, and there are ${daysWithData}.`,
      status: 'insufficient_data',
    }
  }

  // Evaluate on the last 14 days, which the model does not see (same protocol as the backend).
  const holdout = Math.min(14, Math.floor((series.length - 7) / 2))
  const train = series.slice(0, -holdout)
  const test = series.slice(-holdout)
  const evalModel = fitSeasonalTrend(train)
  const mae = sum(test.map((d, i) => Math.abs(d.y - evalModel(train.length + i, d.date)))) / holdout
  // "Same day last week" baseline, using only data before the hold-out: repeat the last observed week.
  const lastWeek = train.slice(-7)
  const baselineMae = sum(test.map((d, i) => Math.abs(d.y - lastWeek[i % 7].y))) / holdout

  // Refit on everything for the actual forecast. Band = ±1.5 × validation MAE.
  const model = fitSeasonalTrend(series)
  const band = 1.5 * mae

  const forecast = Array.from({ length: days }, (_, i) => {
    const date = addDays(end, i + 1)
    const predicted = model(series.length + i, date)
    return {
      date,
      predicted_kg: round(predicted),
      lower: round(Math.max(0, predicted - band)),
      upper: round(predicted + band),
    }
  })

  return {
    history,
    forecast,
    model: 'seasonal_trend',
    metrics: { mae: round(mae), baseline_mae: round(baselineMae), holdout_days: holdout },
    note: `${FORECAST_NOTE} Mock data: linear trend with day-of-week seasonality, trained on ${series.length} days. The band is ±1.5 × the validation MAE.`,
    status: 'ok',
  }
}

// Exposed for debugging / tests.
export const __mock = {
  reset: () => {
    records = generateRecords()
    nextId = records.length + 1
  },
  get records() {
    return records
  },
}
