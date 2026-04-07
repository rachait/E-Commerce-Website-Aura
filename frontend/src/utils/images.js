const SVG_PLACEHOLDER = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" fill="#f3f4f6" font-size="34" text-anchor="middle" dominant-baseline="middle" font-family="Arial">AURA</text></svg>'
)

export const AURA_IMAGE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${SVG_PLACEHOLDER}`

const resolveBackendBase = () => {
  const configured = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '')
  if (configured) {
    return configured
  }

  // In local dev, image paths may come back as relative URLs from FastAPI.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:8000`
  }

  return ''
}

export const normalizeImageUrl = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  const backendBase = resolveBackendBase()

  if (trimmed.startsWith('/')) {
    return backendBase ? `${backendBase}${trimmed}` : trimmed
  }

  if (!backendBase) {
    return `/${trimmed.replace(/^\/+/, '')}`
  }

  return `${backendBase}/${trimmed.replace(/^\/+/, '')}`
}

export const getProductImageCandidates = (product) => {
  const images = Array.isArray(product?.images) ? product.images : []
  const legacy = typeof product?.image === 'string' ? [product.image] : []

  const normalized = [...images, ...legacy]
    .map(normalizeImageUrl)
    .filter(Boolean)

  return Array.from(new Set(normalized))
}
