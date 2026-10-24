import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw, RotateCw } from 'lucide-react'
import { buttonClass } from './ui/Button'

const isChunkError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(error?.message ?? '')

function ErrorFallback({ error, onRetry, fullPage }) {
  const chunk = isChunkError(error)
  return (
    <div className={fullPage ? 'flex min-h-dvh items-center justify-center bg-bg p-4' : ''} role="alert">
      <section className="glass edge-glow mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-warning/25 blur-xl" aria-hidden="true" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
            <AlertTriangle size={24} strokeWidth={1.75} />
          </div>
        </div>
        <h2 className="font-display text-heading font-semibold tracking-tight text-ink">
          {chunk ? 'SmartWaste AI was updated' : 'Something went wrong on this page'}
        </h2>
        <p className="mt-2 max-w-md text-body text-ink-muted">
          {chunk
            ? 'A newer version is available. Reload to continue.'
            : 'Your data is safe. Try again, or head back to the dashboard. If it keeps happening, reload the page.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {chunk ? (
            <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
              <RefreshCw size={15} strokeWidth={2} /> Reload
            </button>
          ) : (
            <>
              <button type="button" className={buttonClass('primary')} onClick={onRetry}>
                <RotateCw size={15} strokeWidth={2} /> Try again
              </button>
              <a href="/" className={buttonClass('secondary')}>
                <Home size={15} strokeWidth={2} /> Back to dashboard
              </a>
            </>
          )}
        </div>
        {import.meta.env.DEV && error && (
          <details className="mt-6 w-full text-left">
            <summary className="cursor-pointer text-caption text-ink-faint hover:text-ink-muted">Technical details (dev only)</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-[10px] border border-hair bg-surface-2 p-3 font-mono text-micro whitespace-pre-wrap text-ink-muted">
              {error.stack || String(error)}
            </pre>
          </details>
        )}
      </section>
    </div>
  )
}

/**
 * Catches render errors below it and shows a friendly fallback instead of a blank screen.
 * Pass `resetKey` (e.g. the pathname) so navigating away clears the error.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[SmartWaste AI] UI error:', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} onRetry={this.reset} fullPage={this.props.fullPage} />
    return this.props.children
  }
}
