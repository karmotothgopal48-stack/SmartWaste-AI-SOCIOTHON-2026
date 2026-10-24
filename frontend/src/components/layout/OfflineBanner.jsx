import { AnimatePresence, motion } from 'framer-motion'
import { RotateCw, ServerOff } from 'lucide-react'
import Button from '../ui/Button'
import { useBackendStatus } from '../../hooks/useBackendStatus'
import { API_BASE_URL } from '../../services/api'

export default function OfflineBanner() {
  const { status, check } = useBackendStatus()

  return (
    <AnimatePresence>
      {status === 'offline' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8"
        >
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-danger/35 bg-danger/[0.08] p-4 shadow-[0_0_30px_-12px_rgba(239,68,68,0.5)] backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-danger/30 bg-danger/15 text-danger">
              <ServerOff size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-body font-semibold text-ink">Backend offline: start the API server</p>
              <p className="mt-0.5 text-caption text-ink-muted">
                Can't reach <code className="font-mono text-ink">{API_BASE_URL}</code>. In <code className="font-mono text-ink">backend/</code> run{' '}
                <code className="rounded-md border border-hair bg-surface-2 px-1.5 py-0.5 font-mono break-all text-ink">uvicorn app.main:app --reload --port 8000</code>
                . Reconnecting automatically…
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={RotateCw} onClick={check} className="self-start sm:self-center">
              Retry now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
