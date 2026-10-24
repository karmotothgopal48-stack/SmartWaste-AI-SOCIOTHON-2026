import { AlertTriangle, RotateCw, WifiOff } from 'lucide-react'
import Button from './Button'
import { getErrorMessage } from '../../services/api'

/** Error card with a Retry button. Network failures get an "offline" variant. */
export function ErrorCard({ error, onRetry, title = "Couldn't load this data", compact = false, className = '' }) {
  const offline = error?.status === 0
  const Icon = offline ? WifiOff : AlertTriangle
  return (
    <div
      role="alert"
      className={`glass flex flex-col items-center text-center ${compact ? 'px-5 py-8' : 'px-6 py-14'} ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-heading font-semibold text-ink">{offline ? 'Backend offline' : title}</h3>
      <p className="mt-1 max-w-md text-small text-ink-muted">
        {offline ? 'Start the API server, then retry. This page reloads automatically when it reconnects.' : getErrorMessage(error)}
      </p>
      {onRetry && (
        <Button icon={RotateCw} onClick={onRetry} className="mt-5">
          Retry
        </Button>
      )}
    </div>
  )
}

/** Friendly "nothing here" card. */
export function EmptyCard({ icon: Icon, title, text, children, className = '' }) {
  return (
    <div className={`glass flex flex-col items-center px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" aria-hidden="true" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Icon size={20} strokeWidth={1.75} />
          </div>
        </div>
      )}
      <h3 className="font-display text-heading font-semibold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-md text-small text-ink-muted">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
