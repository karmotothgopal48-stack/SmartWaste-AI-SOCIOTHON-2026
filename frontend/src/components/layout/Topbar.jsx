import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Menu, Search, SlidersHorizontal } from 'lucide-react'
import { titleForPath } from './navigation'
import { API_BASE_URL } from '../../services/api'
import { useBackendStatus } from '../../hooks/useBackendStatus'

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const PILL = {
  online: { label: 'Live: connected', short: 'Live', tone: 'primary', pulse: true },
  mock: { label: 'Demo data', short: 'Demo', tone: 'primary', pulse: false },
  checking: { label: 'Connecting…', short: '…', tone: 'muted', pulse: true },
  offline: { label: 'Offline', short: 'Offline', tone: 'danger', pulse: false },
}
const TONES = {
  primary: { box: 'border-primary/25 bg-primary/[0.08] text-primary', dot: 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.9)]' },
  muted: { box: 'border-hair bg-white/[0.03] text-ink-muted', dot: 'bg-ink-muted' },
  danger: { box: 'border-danger/30 bg-danger/10 text-danger', dot: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]' },
}

function StatusPill() {
  const { status, records, version } = useBackendStatus()
  const pill = PILL[status]
  const tone = TONES[pill.tone]
  const title =
    status === 'online'
      ? `Connected to ${API_BASE_URL} (v${version}, ${records?.toLocaleString('en-US')} records)`
      : status === 'mock'
        ? 'Showing generated demo data (USE_MOCK = true)'
        : status === 'offline'
          ? `Can't reach ${API_BASE_URL}`
          : 'Checking the API…'

  return (
    <div
      className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-caption font-semibold transition-colors ${tone.box}`}
      title={title}
      role="status"
      aria-label={`API status: ${pill.label}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {pill.pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${tone.dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
      </span>
      <span className="hidden sm:inline">{pill.label}</span>
      <span className="sm:hidden">{pill.short}</span>
    </div>
  )
}

export default function Topbar({ onMenu, menuOpen }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // The filter shortcut opens the Records filters (and focuses the first one).
  const openFilters = () => navigate('/records', { state: { focusFilters: Date.now() } })

  return (
    <header className="sticky top-0 z-20 border-b border-hair bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-hair text-ink-muted transition hover:border-strong hover:text-ink lg:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-ink sm:text-[22px]">
            {titleForPath(pathname)}
          </h1>
          <div className="hidden items-center gap-1.5 text-caption text-ink-muted sm:flex">
            <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
            <time dateTime={new Date().toISOString().slice(0, 10)}>{today}</time>
          </div>
        </div>

        <button
          type="button"
          onClick={openFilters}
          className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2.5 rounded-[10px] border border-hair bg-surface-2/70 text-small text-ink-faint transition hover:border-primary/30 hover:text-ink-muted md:w-72 md:justify-start md:px-3"
          aria-label="Filter records by date, building or category"
        >
          <Search size={16} strokeWidth={1.75} className="text-ink-muted" aria-hidden="true" />
          <span className="hidden flex-1 text-left md:inline">Filter by date, building, category…</span>
          <SlidersHorizontal size={15} strokeWidth={1.75} className="hidden text-ink-muted transition-colors group-hover:text-primary md:block" aria-hidden="true" />
        </button>

        <StatusPill />
      </div>
    </header>
  )
}
