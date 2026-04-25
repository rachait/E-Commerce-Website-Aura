import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/globals.css'
import { initGoogleTagManager } from './utils/analytics'
import { registerSW } from 'virtual:pwa-register'
import { initVendorIntegrations } from './utils/vendorIntegrations'
import { initSessionReplay } from './utils/sessionReplay'

if (import.meta.env.PROD) {
  initGoogleTagManager()
  registerSW({ immediate: true })
}

const bootstrapOptionalIntegrations = () => {
  initVendorIntegrations()
  initSessionReplay()
}

if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(bootstrapOptionalIntegrations, { timeout: 1500 })
} else {
  setTimeout(bootstrapOptionalIntegrations, 600)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
