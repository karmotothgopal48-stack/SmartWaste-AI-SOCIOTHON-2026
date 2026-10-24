import { ChevronLeft, ChevronRight } from 'lucide-react'

// [1, '…', 4, 5, 6, '…', 20]
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`)
    out.push(p)
  })
  return out
}

export default function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-[10px] px-2 text-small font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-hair px-4 py-3.5 sm:flex-row sm:px-5" aria-label="Pagination">
      <p className="text-caption text-ink-muted">
        Showing <span className="font-mono font-bold text-ink">{from.toLocaleString('en-US')}–{to.toLocaleString('en-US')}</span> of{' '}
        <span className="font-mono font-bold text-ink">{total.toLocaleString('en-US')}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={`${btn} text-ink-muted hover:bg-white/5 hover:text-ink`} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-caption text-ink-faint">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} font-mono ${
                p === page
                  ? 'border border-primary/40 bg-primary/15 text-primary shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]'
                  : 'text-ink-muted hover:bg-white/5 hover:text-ink'
              } ${Math.abs(p - page) > 1 && p !== 1 && p !== totalPages ? 'hidden sm:flex' : ''}`}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={`${btn} text-ink-muted hover:bg-white/5 hover:text-ink`} onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
    </nav>
  )
}
