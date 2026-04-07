import axios from 'axios'
import { getProductImageCandidates } from './images'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

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
    axios.post(`${API_URL}/api/auth/register`, { email, password, name }),
  login: (email, password) =>
    axios.post(`${API_URL}/api/auth/login`, { email, password }),
  getCurrentUser: () =>
    axios.get(`${API_URL}/api/auth/me`),
  getAdminUsers: (limit = 50, offset = 0, search = '') =>
    axios.get(`${API_URL}/api/auth/admin/users`, { params: { limit, offset, search } })
}

export const productsAPI = {
  getAll: (category, search, limit = 20, offset = 0, extraParams = {}) =>
    axios
      .get(`${API_URL}/api/products`, { params: { category, search, limit, offset, ...extraParams } })
      .then((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
      })),
  getFeatured: (limit = 8) =>
    axios
      .get(`${API_URL}/api/products/featured`, { params: { limit } })
      .then((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
      })),
  getById: (id) =>
    axios
      .get(`${API_URL}/api/products/${id}`)
      .then((response) => ({
        ...response,
        data: normalizeProduct(response.data)
      })),
  getReviews: (id, limit = 20) =>
    axios.get(`${API_URL}/api/products/${id}/reviews`, { params: { limit } }),
  addReview: (id, rating, comment) =>
    axios.post(`${API_URL}/api/products/${id}/reviews`, { rating, comment }),
  trackView: (id) =>
    axios.post(`${API_URL}/api/products/${id}/track-view`),
  create: (data) =>
    axios.post(`${API_URL}/api/products`, data),
  update: (id, data) =>
    axios.put(`${API_URL}/api/products/${id}`, data),
  delete: (id) =>
    axios.delete(`${API_URL}/api/products/${id}`)
}

export const cartAPI = {
  get: () =>
    axios.get(`${API_URL}/api/cart`),
  add: (productId, quantity, size) =>
    axios.post(`${API_URL}/api/cart/add`, { productId, quantity, size }),
  update: (productId, quantity) =>
    axios.put(`${API_URL}/api/cart/update`, { productId, quantity }),
  remove: (productId) =>
    axios.delete(`${API_URL}/api/cart/remove/${productId}`),
  clear: () =>
    axios.delete(`${API_URL}/api/cart/clear`)
}

export const ordersAPI = {
  getAll: () =>
    axios.get(`${API_URL}/api/orders`),
  getById: (id) =>
    axios.get(`${API_URL}/api/orders/${id}`),
  getInvoiceUrl: (id) =>
    `${API_URL}/api/orders/${id}/invoice`,
  create: (data) =>
    axios.post(`${API_URL}/api/orders/create`, data),
  getAllAdmin: () =>
    axios.get(`${API_URL}/api/orders/admin/all`),
  updateStatus: (id, status) =>
    axios.put(`${API_URL}/api/orders/${id}/status`, { status })
}

export const couponsAPI = {
  validate: (code, cartTotal) =>
    axios.post(`${API_URL}/api/coupons/validate`, { code, cartTotal })
}

export const accountAPI = {
  getAddresses: () =>
    axios.get(`${API_URL}/api/account/addresses`),
  addAddress: (address) =>
    axios.post(`${API_URL}/api/account/addresses`, address),
  updateAddress: (addressId, address) =>
    axios.put(`${API_URL}/api/account/addresses/${addressId}`, address),
  deleteAddress: (addressId) =>
    axios.delete(`${API_URL}/api/account/addresses/${addressId}`),
  getPaymentMethods: () =>
    axios.get(`${API_URL}/api/account/payment-methods`),
  addPaymentMethod: (payload) =>
    axios.post(`${API_URL}/api/account/payment-methods`, payload)
}

export const returnsAPI = {
  create: (orderId, reason) =>
    axios.post(`${API_URL}/api/returns`, { orderId, reason }),
  getMine: () =>
    axios.get(`${API_URL}/api/returns`),
  getAllAdmin: () =>
    axios.get(`${API_URL}/api/returns/admin`),
  updateStatus: (returnId, status) =>
    axios.put(`${API_URL}/api/returns/${returnId}/status`, null, { params: { status } })
}

export const analyticsAPI = {
  getAdminOverview: () =>
    axios.get(`${API_URL}/api/analytics/admin/overview`)
}

export const paymentAPI = {
  createOrder: (totalAmount, orderId, paymentMethod = 'razorpay') =>
    axios.post(`${API_URL}/api/payment/create-order`, { totalAmount, orderId, paymentMethod }),
  verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    axios.post(`${API_URL}/api/payment/verify`, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })
}

export const cloudinaryAPI = {
  getSignature: () =>
    axios.get(`${API_URL}/api/cloudinary/signature`)
}

export const aiAPI = {
  chat: (messages, sessionId) =>
    axios.post(`${API_URL}/api/ai/chat`, { messages, sessionId }),
  getRecommendations: (userId, limit = 5) =>
    axios.post(`${API_URL}/api/ai/recommendations`, { userId, limit }),
  getRecentlyViewed: (limit = 10) =>
    axios.get(`${API_URL}/api/ai/recently-viewed`, { params: { limit } }),
  getStyleAdvice: (productId, userPreferences) =>
    axios.post(`${API_URL}/api/ai/style-advisor`, { productId, userPreferences })
}
