import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/globals.css'
import { initGoogleTagManager } from './utils/analytics'
import { registerSW } from 'virtual:pwa-register'
import { initVendorIntegrations } from './utils/vendorIntegrations'
import { initSessionReplay } from './utils/sessionReplay'

initGoogleTagManager()
initVendorIntegrations()
initSessionReplay()
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
