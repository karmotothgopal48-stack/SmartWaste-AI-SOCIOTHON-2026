import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { AnimatePresence, motion } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import Logo from './Logo'
import { NAV_ITEMS } from './navigation'

function NavItems({ layoutGroup }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      <div className="label-caps mb-2 px-3 text-micro text-ink-faint">Monitor</div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `group relative flex h-11 items-center gap-3 rounded-[10px] px-3 text-body font-medium transition-colors ${
              isActive ? 'bg-primary/[0.08] text-ink' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId={`${layoutGroup}-active-bar`}
                  className="absolute top-2 bottom-2 -left-4 w-[3px] rounded-r-full bg-primary shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon
                size={18}
                strokeWidth={1.75}
                className={isActive ? 'text-primary drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'transition-colors group-hover:text-ink'}
              />
              {label}
              {to === '/forecast' && (
                <span className="ml-auto rounded-full border border-accent/30 px-1.5 py-px text-micro font-semibold text-accent">
                  ML
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SociothonBadge() {
  return (
    <div className="glass edge-glow overflow-hidden p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
          <Trophy size={16} strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <div className="font-display text-caption font-semibold tracking-wide text-ink">SOCIOTHON 2026</div>
          <div className="text-micro text-ink-faint">Data-Driven Waste Monitoring</div>
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ layoutGroup, onClose }) {
  return (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <Logo />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-ink-muted hover:bg-white/5 hover:text-ink"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <div className="my-6 h-px bg-hair" />
      <NavItems layoutGroup={layoutGroup} />
      <div className="mt-auto pt-6">
        <SociothonBadge />
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { pathname } = useLocation()

  // Close the drawer on navigation.
  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const drawerRef = useRef(null)
  useFocusTrap(drawerRef, mobileOpen, { onEscape: onClose })

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-hair bg-surface-1/60 backdrop-blur-xl lg:block">
        <SidebarContent layoutGroup="desktop" />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-nav"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-hair bg-surface-1/95 backdrop-blur-xl outline-none"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <SidebarContent layoutGroup="mobile" onClose={onClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
