import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersAPI, returnsAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'

const InvoicePreviewModal = lazy(() => import('../components/InvoicePreviewModal'))

export default function Orders() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [previewOrderId, setPreviewOrderId] = useState(null)
  const [returnLoadingOrderId, setReturnLoadingOrderId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await ordersAPI.getAll()
        setOrders(response.data || [])
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, navigate])

  const handleReturnRequest = async (orderId) => {
    const reason = window.prompt('Reason for return request:')
    if (!reason) {
      return
    }

    try {
      setReturnLoadingOrderId(orderId)
      await returnsAPI.create(orderId, reason)
      const response = await ordersAPI.getAll()
      setOrders(response.data || [])
      alert('Return request submitted')
    } catch (error) {
      alert(error?.response?.data?.detail || 'Failed to create return request')
    } finally {
      setReturnLoadingOrderId(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={20} />
      case 'processing':
        return <Clock className="text-yellow-400" size={20} />
      case 'pending':
        return <AlertCircle className="text-orange-400" size={20} />
      default:
        return <Package className="text-text-secondary" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'processing':
        return 'text-yellow-400'
      case 'pending':
        return 'text-orange-400'
      default:
        return 'text-text-secondary'
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 flex justify-center items-center min-h-screen">
        <div className="animate-pulse-neon text-cyan-neon text-xl">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-text-secondary">Track and manage your purchases</p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-12 rounded-lg text-center"
          >
            <Package size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <h2 className="font-heading text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-text-secondary mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/products/featured')}
              className="glass-button py-2 px-6 rounded-lg"
            >
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel rounded-lg overflow-hidden"
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-cyan-neon/5 transition text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(order.paymentStatus)}
                      <div>
                        <h3 className="font-heading font-bold">
                          Order #{order.orderId}
                        </h3>
                        <p className="text-text-secondary text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 mt-4 sm:mt-0">
                    <div className="text-right">
                      <p className="text-text-secondary text-sm">Total Amount</p>
                      <p className="neon-text font-bold text-xl">₹{order.totalAmount?.toFixed(2) || '0'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading font-bold capitalize ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </p>
                      <p className="text-text-secondary text-xs">Items: {order.items?.length || 0}</p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Order Details */}
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6 border-t border-cyan-neon/20"
                  >
                    {/* Items */}
                    <div className="mb-6">
                      <h4 className="font-heading font-bold mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-start pb-3 border-b border-text-secondary/10">
                            <div>
                              <p className="font-body font-600">{item.productId}</p>
                              <p className="text-text-secondary text-sm">
                                Qty: {item.quantity} | Size: {item.size}
                              </p>
                            </div>
                            <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-6">
                      <h4 className="font-heading font-bold mb-3">Shipping Address</h4>
                      <div className="glass-panel p-4 rounded-lg text-sm text-text-secondary">
                        <p className="font-body font-600 text-text-primary mb-2">
                          {order.shippingAddress?.name}
                        </p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                        <p className="mt-2">📞 {order.shippingAddress?.phone}</p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="glass-panel p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between text-text-secondary">
                        <span>Subtotal</span>
                        <span>₹{(order.totalAmount / 1.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Tax (18%)</span>
                        <span>₹{(order.totalAmount * 0.18 / 1.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Shipping</span>
                        <span className="text-cyan-neon">Free</span>
                      </div>
                      <div className="border-t border-text-secondary/20 pt-2 flex justify-between font-heading font-bold">
                        <span>Total</span>
                        <span className="neon-text">₹{order.totalAmount?.toFixed(2) || '0'}</span>
                      </div>
                    </div>

                    {order.timeline?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-heading font-bold mb-3">Tracking Timeline</h4>
                        <div className="space-y-2">
                          {order.timeline.map((event, eventIdx) => (
                            <div key={`${order.id}-${eventIdx}`} className="flex items-start gap-3 text-sm">
                              <div className="mt-1 h-2 w-2 rounded-full bg-cyan-neon" />
                              <div>
                                <p className="capitalize text-text-primary">{event.status}</p>
                                <p className="text-text-secondary">{event.note}</p>
                                <p className="text-xs text-text-secondary/80">
                                  {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-4">
                      {order.paymentStatus === 'completed' && (
                        <button
                          onClick={() => setPreviewOrderId(order.id)}
                          className="flex-1 py-2 glass-button rounded-lg text-sm hover:bg-cyan-neon/10 transition"
                        >
                          Preview Invoice
                        </button>
                      )}
                      <button className="flex-1 py-2 border border-text-secondary/30 rounded-lg text-sm hover:border-cyan-neon transition">
                        Track Order
                      </button>
                      {order.status === 'delivered' && !order.returnStatus && (
                        <button
                          onClick={() => handleReturnRequest(order.id)}
                          disabled={returnLoadingOrderId === order.id}
                          className="flex-1 py-2 border border-orange-400/40 text-orange-300 rounded-lg text-sm hover:border-orange-400 transition disabled:opacity-60"
                        >
                          {returnLoadingOrderId === order.id ? 'Submitting...' : 'Request Return'}
                        </button>
                      )}
                      {order.returnStatus && (
                        <div className="flex-1 py-2 border border-orange-400/30 text-orange-300 rounded-lg text-sm text-center capitalize">
                          Return: {order.returnStatus}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {previewOrderId && (
        <Suspense fallback={null}>
          <InvoicePreviewModal
            open={Boolean(previewOrderId)}
            invoiceUrl={ordersAPI.getInvoiceUrl(previewOrderId)}
            onClose={() => setPreviewOrderId(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
