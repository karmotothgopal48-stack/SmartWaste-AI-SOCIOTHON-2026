// Number and date formatting shared by the UI.

export const fmtNumber = (n, dp = 1) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

/** Short axis ticks: 350 → "350", 2210 → "2.2k" */
export const fmtAxisKg = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`)

const parse = (iso) => new Date(`${iso}T00:00:00`)

export const fmtShortDate = (iso) => parse(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const fmtLongDate = (iso) =>
  parse(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Today's date in the browser's local time zone, YYYY-MM-DD. */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const capitalize =(s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)
