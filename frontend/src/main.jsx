import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Last line of defence: errors outside a page (e.g. in the layout) still get a friendly screen. */}
    <ErrorBoundary fullPage>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
