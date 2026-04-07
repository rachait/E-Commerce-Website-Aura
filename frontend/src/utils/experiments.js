import { trackEvent } from './analytics'
import { isFeatureEnabled } from './featureFlags'

const EXPOSURE_KEY_PREFIX = 'exp-exposed:'
const ASSIGNMENT_KEY_PREFIX = 'exp-assign:'
const ANON_ID_KEY = 'exp-anon-id'

function hashString(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

function getAnonymousId() {
  if (typeof window === 'undefined') {
    return 'server-render'
  }

  const existing = localStorage.getItem(ANON_ID_KEY)
  if (existing) {
    return existing
  }

  const generated = `anon-${Math.random().toString(36).slice(2, 12)}`
  localStorage.setItem(ANON_ID_KEY, generated)
  return generated
}

function getBucketedVariant(seedValue, variants) {
  const hash = hashString(seedValue)
  const bucket = hash % variants.length
  return variants[bucket]
}

export function getExperimentVariant({
  experimentKey,
  variants = ['control', 'variant'],
  userId,
  gateFlag
}) {
  if (!experimentKey || !Array.isArray(variants) || variants.length === 0) {
    return 'control'
  }

  if (gateFlag && !isFeatureEnabled(gateFlag)) {
    return variants[0]
  }

  if (typeof window === 'undefined') {
    return variants[0]
  }

  const storageKey = `${ASSIGNMENT_KEY_PREFIX}${experimentKey}`
  const existing = localStorage.getItem(storageKey)
  if (existing && variants.includes(existing)) {
    return existing
  }

  const identity = userId || getAnonymousId()
  const variant = getBucketedVariant(`${experimentKey}:${identity}`, variants)
  localStorage.setItem(storageKey, variant)

  return variant
}

export function trackExperimentExposure(experimentKey, variant, metadata = {}) {
  if (!experimentKey || !variant || typeof window === 'undefined') {
    return
  }

  const exposureKey = `${EXPOSURE_KEY_PREFIX}${experimentKey}:${variant}`
  if (sessionStorage.getItem(exposureKey)) {
    return
  }

  sessionStorage.setItem(exposureKey, '1')
  trackEvent('experiment_exposure', {
    experiment_key: experimentKey,
    variant,
    ...metadata
  })
}

export function trackExperimentConversion(experimentKey, variant, conversionEvent, metadata = {}) {
  if (!experimentKey || !variant || !conversionEvent) {
    return
  }

  trackEvent('experiment_conversion', {
    experiment_key: experimentKey,
    variant,
    conversion_event: conversionEvent,
    ...metadata
  })
}
