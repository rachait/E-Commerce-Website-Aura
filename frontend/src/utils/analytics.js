const GTM_ID = import.meta.env.VITE_GTM_ID

export function initGoogleTagManager() {
  if (!GTM_ID || typeof window === 'undefined') {
    return
  }

  if (window.__gtmInitialized) {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)

  window.__gtmInitialized = true
}

export function trackEvent(event, payload = {}) {
  if (typeof window === 'undefined' || !event) {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event,
    ...payload
  })
}
