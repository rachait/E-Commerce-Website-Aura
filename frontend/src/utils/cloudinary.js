export const isCloudinaryUrl = (url) => {
  try {
    return typeof url === 'string' && url.includes('res.cloudinary.com')
  } catch {
    return false
  }
}

// Apply transformations to a Cloudinary upload URL. If not a Cloudinary URL, return original.
export const cloudinaryUrl = (url, transforms = 'f_auto,q_auto,w_600,h_800,c_fill,g_auto') => {
  if (!url || typeof url !== 'string') return url
  if (!isCloudinaryUrl(url)) return url

  // Only replace the first occurrence of /upload/
  return url.replace('/upload/', `/upload/${transforms}/`)
}

// Build a simple placeholder using Cloudinary transformations against a public placeholder image
export const cloudinaryPlaceholder = (transforms = 'f_auto,q_auto,w_600,h_800,c_fill,g_auto', publicId = 'placeholder') => {
  // If you have a placeholder image in your Cloudinary account, set its publicId here.
  // As a fallback, this returns an empty string and callers should use a local/data URI fallback.
  if (!publicId) return ''
  return `https://res.cloudinary.com/demo/image/upload/${transforms}/${publicId}.jpg`
}
