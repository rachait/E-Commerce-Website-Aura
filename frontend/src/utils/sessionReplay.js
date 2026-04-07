import { isFeatureEnabled } from './featureFlags'
import { trackEvent } from './analytics'

const HOTJAR_SITE_ID = import.meta.env.VITE_HOTJAR_SITE_ID
const HOTJAR_VERSION = import.meta.env.VITE_HOTJAR_VERSION || '6'

export function initSessionReplay() {
  if (typeof window === 'undefined') {
    return
  }

  if (!isFeatureEnabled('enableSessionReplay')) {
    return
  }

  if (!HOTJAR_SITE_ID || window.__sessionReplayInitialized) {
    return
  }

  ;(function loadHotjar(w, d, h, o, t, j, a, r) {
    w.hj =
      w.hj ||
      function hotjar() {
        ;(w.hj.q = w.hj.q || []).push(arguments)
      }
    w._hjSettings = { hjid: Number(t), hjsv: Number(r) }
    a = d.getElementsByTagName('head')[0]
    j = d.createElement('script')
    j.async = true
    j.src = `${h}${o}${w._hjSettings.hjid}${o}${w._hjSettings.hjsv}`
    a.appendChild(j)
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=', HOTJAR_SITE_ID, null, null, HOTJAR_VERSION)

  window.__sessionReplayInitialized = true
  trackEvent('session_replay_enabled', {
    provider: 'hotjar'
  })
}
