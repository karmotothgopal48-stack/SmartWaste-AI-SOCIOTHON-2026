/** Small pill switcher (e.g. 30 days / 90 days / All time). Arrow keys move between options. */
export default function SegmentedControl({ options, value, onChange, label }) {
  const onKeyDown = (e) => {
    const i = options.findIndex((o) => o.value === value)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = options[(i + step + options.length) % options.length]
    onChange(next.value)
    e.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex rounded-[12px] border border-hair bg-surface-2/70 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={o.value}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-[9px] px-3 text-small font-semibold whitespace-nowrap transition ${
              active ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
