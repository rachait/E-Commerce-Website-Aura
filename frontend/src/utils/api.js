import axios from 'axios'
import { getProductImageCandidates } from './images'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''
const RETRYABLE_METHODS = new Set(['get', 'head', 'options'])

const apiState = {
  isOnline: true,
  isReconnecting: false,
  lastErrorAt: null
}

const statusSubscribers = new Set()

const notifyApiStatusChange = () => {
  statusSubscribers.forEach((callback) => callback({ ...apiState }))
}

const setApiState = (nextState) => {
  const hasChange = Object.keys(nextState).some((key) => apiState[key] !== nextState[key])
  if (!hasChange) {
    return
  }

  Object.assign(apiState, nextState)
  notifyApiStatusChange()
}

export const getApiConnectionState = () => ({ ...apiState })

export const onApiStatusChange = (callback) => {
  statusSubscribers.add(callback)
  callback({ ...apiState })
  return () => statusSubscribers.delete(callback)
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const apiClient = axios.create({
  baseURL: API_URL
})

apiClient.interceptors.response.use(
  (response) => {
    setApiState({ isOnline: true, isReconnecting: false })
    return response
  },
  async (error) => {
    const config = error?.config || {}
    const method = (config.method || 'get').toLowerCase()
    const hasResponse = Boolean(error?.response)
    const isNetworkIssue = !hasResponse

    if (!isNetworkIssue) {
      return Promise.reject(error)
    }

    const attempt = config.__retryCount || 0
    const shouldRetry = RETRYABLE_METHODS.has(method) && attempt < 2

    setApiState({
      isOnline: false,
      isReconnecting: shouldRetry,
      lastErrorAt: Date.now()
    })

    if (!shouldRetry) {
      return Promise.reject(error)
    }

    config.__retryCount = attempt + 1
    const retryDelayMs = 500 * (2 ** attempt)
    await delay(retryDelayMs)
    return apiClient(config)
  }
)

const normalizeProduct = (product) => {
  if (!product || typeof product !== 'object') {
    return product
  }

  return {
    ...product,
    images: getProductImageCandidates(product)
  }
}

export const authAPI = {
  register: (email, password, name) =>
    apiClient.post('/api/auth/register', { email, password, name }),
  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }),
  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),
  getAdminUsers: (limit = 50, offset = 0, search = '') =>
    apiClient.get('/api/auth/admin/users', { params: { limit, offset, search } })
}

export const productsAPI = {
  getAll: (category, search, limit = 20, offset = 0, extraParams = {}) =>
    apiClient
      .get('/api/products', { params: { category, search, limit, offset, ...extraParams } })
      .then((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
      })),
  getFeatured: (limit = 8) =>
    apiClient
      .get('/api/products/featured', { params: { limit } })
      .then((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
      })),
  getById: (id) =>
    apiClient
      .get(`/api/products/${id}`)
      .then((response) => ({
        ...response,
        data: normalizeProduct(response.data)
      })),
  getReviews: (id, limit = 20) =>
    apiClient.get(`/api/products/${id}/reviews`, { params: { limit } }),
  addReview: (id, rating, comment) =>
    apiClient.post(`/api/products/${id}/reviews`, { rating, comment }),
  trackView: (id) =>
    apiClient.post(`/api/products/${id}/track-view`),
  create: (data) =>
    apiClient.post('/api/products', data),
  update: (id, data) =>
    apiClient.put(`/api/products/${id}`, data),
  delete: (id) =>
    apiClient.delete(`/api/products/${id}`)
}

export const cartAPI = {
  get: () =>
    apiClient.get('/api/cart'),
  add: (productId, quantity, size) =>
    apiClient.post('/api/cart/add', { productId, quantity, size }),
  update: (productId, quantity) =>
    apiClient.put('/api/cart/update', { productId, quantity }),
  remove: (productId) =>
    apiClient.delete(`/api/cart/remove/${productId}`),
  clear: () =>
    apiClient.delete('/api/cart/clear')
}

export const ordersAPI = {
  getAll: () =>
    apiClient.get('/api/orders'),
  getById: (id) =>
    apiClient.get(`/api/orders/${id}`),
  getInvoiceUrl: (id) =>
    `${API_URL}/api/orders/${id}/invoice`,
  create: (data) =>
    apiClient.post('/api/orders/create', data),
  getAllAdmin: () =>
    apiClient.get('/api/orders/admin/all'),
  updateStatus: (id, status) =>
    apiClient.put(`/api/orders/${id}/status`, { status })
}

export const couponsAPI = {
  validate: (code, cartTotal) =>
    apiClient.post('/api/coupons/validate', { code, cartTotal })
}

export const accountAPI = {
  getAddresses: () =>
    apiClient.get('/api/account/addresses'),
  addAddress: (address) =>
    apiClient.post('/api/account/addresses', address),
  updateAddress: (addressId, address) =>
    apiClient.put(`/api/account/addresses/${addressId}`, address),
  deleteAddress: (addressId) =>
    apiClient.delete(`/api/account/addresses/${addressId}`),
  getPaymentMethods: () =>
    apiClient.get('/api/account/payment-methods'),
  addPaymentMethod: (payload) =>
    apiClient.post('/api/account/payment-methods', payload)
}

export const returnsAPI = {
  create: (orderId, reason) =>
    apiClient.post('/api/returns', { orderId, reason }),
  getMine: () =>
    apiClient.get('/api/returns'),
  getAllAdmin: () =>
    apiClient.get('/api/returns/admin'),
  updateStatus: (returnId, status) =>
    apiClient.put(`/api/returns/${returnId}/status`, null, { params: { status } })
}

export const analyticsAPI = {
  getAdminOverview: () =>
    apiClient.get('/api/analytics/admin/overview')
}

export const paymentAPI = {
  createOrder: (totalAmount, orderId, paymentMethod = 'razorpay') =>
    apiClient.post('/api/payment/create-order', { totalAmount, orderId, paymentMethod }),
  verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    apiClient.post('/api/payment/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })
}

export const cloudinaryAPI = {
  getSignature: () =>
    apiClient.get('/api/cloudinary/signature')
}

export const aiAPI = {
  chat: (messages, sessionId) =>
    apiClient.post('/api/ai/chat', { messages, sessionId }),
  getRecommendations: (userId, limit = 5) =>
    apiClient.post('/api/ai/recommendations', { userId, limit }),
  getRecentlyViewed: (limit = 10) =>
    apiClient.get('/api/ai/recently-viewed', { params: { limit } }),
  getStyleAdvice: (productId, userPreferences) =>
    apiClient.post('/api/ai/style-advisor', { productId, userPreferences })
}
