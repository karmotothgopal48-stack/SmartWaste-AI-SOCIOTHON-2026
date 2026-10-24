import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Background from './Background'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import OfflineBanner from './OfflineBanner'
import { titleForPath } from './navigation'
import ErrorBoundary from '../ErrorBoundary'
import Skeleton from '../ui/Skeleton'

/** Shown while a lazily loaded page's code arrives. */
function PageFallback() {
  return (
    <div className="grid gap-4 lg:gap-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMenu = useCallback(() => setMobileOpen(false), [])
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = pathname === '/' ? 'SmartWaste AI · Campus Waste Intelligence' : `${titleForPath(pathname)} · SmartWaste AI`
  }, [pathname])

  return (
    <div className="relative isolate min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-[10px] bg-primary px-4 py-2 text-small font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <Background />
      <Sidebar mobileOpen={mobileOpen} onClose={closeMenu} />
      <div className="lg:pl-60">
        <Topbar onMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} />
        <OfflineBanner />
        <motion.main
          id="main"
          tabIndex={-1}
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[1440px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </motion.main>
      </div>
    </div>
  )
}
