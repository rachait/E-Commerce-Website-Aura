function loadScript(src, id) {
  if (!src || typeof document === 'undefined') {
    return
  }

  if (id && document.getElementById(id)) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = src
  if (id) {
    script.id = id
  }
  document.head.appendChild(script)
}

function loadOneTrust(domainScript) {
  if (!domainScript || typeof document === 'undefined') {
    return
  }

  if (document.getElementById('onetrust-sdk')) {
    return
  }

  const script = document.createElement('script')
  script.src = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js'
  script.type = 'text/javascript'
  script.charset = 'UTF-8'
  script.setAttribute('data-domain-script', domainScript)
  script.id = 'onetrust-sdk'
  document.head.appendChild(script)
}

export function initVendorIntegrations() {
  const oneTrustDomainScript = import.meta.env.VITE_ONETRUST_DOMAIN_SCRIPT
  if (oneTrustDomainScript) {
    loadOneTrust(oneTrustDomainScript)
    if (typeof window !== 'undefined') {
      window.OptanonWrapper = window.OptanonWrapper || function OptanonWrapper() {}
    }
  }

  const riskifiedShop = import.meta.env.VITE_RISKIFIED_SHOP_DOMAIN
  if (riskifiedShop) {
    loadScript(`https://beacon.riskified.com?shop=${riskifiedShop}`, 'riskified-beacon')
  }
}
