const DEFAULT_FLAGS = {
  enableHomepageHeroExperiment: true,
  enableSessionReplay: false,
  enableSemanticSearchBeta: false,
  enableFraudInsightsBeta: false
}

const OVERRIDES_STORAGE_KEY = 'feature-flag-overrides'

function parseJson(value, fallback) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function getFeatureFlags() {
  const envFlags = parseJson(import.meta.env.VITE_FEATURE_FLAGS, {})

  if (typeof window === 'undefined') {
    return {
      ...DEFAULT_FLAGS,
      ...envFlags
    }
  }

  const overrides = parseJson(localStorage.getItem(OVERRIDES_STORAGE_KEY), {})

  return {
    ...DEFAULT_FLAGS,
    ...envFlags,
    ...overrides
  }
}

export function isFeatureEnabled(flagName) {
  return Boolean(getFeatureFlags()[flagName])
}

export function setFeatureFlagOverride(flagName, enabled) {
  if (typeof window === 'undefined' || !flagName) {
    return
  }

  const overrides = parseJson(localStorage.getItem(OVERRIDES_STORAGE_KEY), {})
  overrides[flagName] = Boolean(enabled)
  localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides))
}

export function clearFeatureFlagOverrides() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(OVERRIDES_STORAGE_KEY)
}
