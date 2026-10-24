import { AlertCircle, ChevronDown } from 'lucide-react'

// focus-within as well as focus: Chromium date inputs move focus into internal day/month/year
// segments, where the input itself stops matching :focus.
export const inputClass = (error) =>
  `h-10 w-full rounded-[10px] border bg-surface-2 px-3 text-body text-ink placeholder:text-ink-faint outline-none transition [color-scheme:dark] focus:ring-2 focus-within:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
    error
      ? 'border-danger/70 focus:border-danger focus-within:border-danger focus:ring-danger/25 focus-within:ring-danger/25'
      : 'border-hair hover:border-strong focus:border-primary focus-within:border-primary focus:ring-primary/30 focus-within:ring-primary/30'
  }`

export function Field({ label, htmlFor, error, hint, optional, children, className = '' }) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-ink-muted">
          {label}
          {optional && <span className="font-normal text-ink-faint">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-center gap-1 text-caption text-danger">
          <AlertCircle size={13} strokeWidth={2} className="shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-caption text-ink-faint">{hint}</p>
      )}
    </div>
  )
}

/** Native select with the design-system skin. */
export function Select({ error, className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${inputClass(error)} cursor-pointer appearance-none pr-9`} {...props}>
        {children}
      </select>
      <ChevronDown size={15} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted" />
    </div>
  )
}
