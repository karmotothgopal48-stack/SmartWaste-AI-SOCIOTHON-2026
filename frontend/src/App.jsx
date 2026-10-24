import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import AppLayout from './components/layout/AppLayout'
import { colors } from './lib/theme'
import { useMediaQuery } from './hooks/useMediaQuery'
import { BackendStatusProvider } from './hooks/useBackendStatus'

// Route-level code splitting: charts (Recharts) only load with the pages that use them.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Records = lazy(() => import('./pages/Records'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Forecast = lazy(() => import('./pages/Forecast'))
const NotFound = lazy(() => import('./pages/NotFound'))
// Dev-only route to check the error boundary: /__crash
const Crash = import.meta.env.DEV ? lazy(() => import('./pages/DevCrash')) : null

export default function App() {
  const isMobile = useMediaQuery('(max-width: 639px)')

  return (
    // Respect the OS "reduce motion" setting for every Framer Motion animation.
    <MotionConfig reducedMotion="user">
      <BackendStatusProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="records" element={<Records />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="forecast" element={<Forecast />} />
            {Crash && <Route path="__crash" element={<Crash />} />}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster
          position={isMobile ? 'top-center' : 'bottom-right'}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15,34,25,0.92)',
              backdropFilter: 'blur(14px)',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.primary}`,
              borderRadius: 12,
              fontSize: 13,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              boxShadow: '0 12px 40px -12px rgba(0,0,0,0.7)',
            },
            success: { iconTheme: { primary: colors.primary, secondary: colors.bg } },
            error: {
              style: { borderLeft: `3px solid ${colors.danger}` },
              iconTheme: { primary: colors.danger, secondary: colors.bg },
            },
          }}
        />
      </BrowserRouter>
      </BackendStatusProvider>
    </MotionConfig>
  )
}
