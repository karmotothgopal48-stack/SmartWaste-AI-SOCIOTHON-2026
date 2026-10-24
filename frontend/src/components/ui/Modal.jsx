import { useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Glass modal. Centred on desktop, bottom sheet on mobile.
 * Closes on Escape / backdrop unless `dismissible` is false (e.g. while saving).
 */
export default function Modal({ open, onClose, title, subtitle, icon: Icon, tone = 'primary', dismissible = true, maxWidth = 'max-w-lg', children, footer }) {
  const panelRef = useRef(null)
  useFocusTrap(panelRef, open, { onEscape: () => dismissible && onClose() })

  const toneClass = tone === 'danger' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-primary/30 bg-primary/10 text-primary'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismissible && onClose()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`relative flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-2xl border border-strong bg-surface-1/[0.92] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(16,185,129,0.06)] backdrop-blur-2xl outline-none sm:rounded-2xl`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
            <div className="flex items-start gap-3 border-b border-hair px-5 py-4 sm:px-6">
              {Icon && (
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border ${toneClass}`}>
                  <Icon size={18} strokeWidth={1.75} />
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 id="modal-title" className="font-display text-heading font-semibold tracking-tight text-ink">{title}</h2>
                {subtitle && <p className="mt-0.5 text-small text-ink-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={!dismissible}
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-40"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-hair px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
