import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { paymentAPI, ordersAPI, accountAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Package, MapPin, CreditCard, CheckCircle } from 'lucide-react'
import { trackEvent } from '../utils/analytics'

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [isRazorpayReady, setIsRazorpayReady] = useState(Boolean(window.Razorpay))
  const [step, setStep] = useState('address') // address, payment, confirm
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [couponApplied, setCouponApplied] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('applied-coupon') || 'null')
    } catch {
      return null
    }
  })
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  const cartItems = cart?.items || []
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = Number(couponApplied?.discountAmount || 0)
  const discountedSubtotal = Math.max(subtotal - discount, 0)
  const tax = discountedSubtotal * 0.18
  const total = discountedSubtotal + tax

  React.useEffect(() => {
    if (window.Razorpay) {
      setIsRazorpayReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setIsRazorpayReady(true)
    script.onerror = () => setIsRazorpayReady(false)
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  React.useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await accountAPI.getAddresses()
        const addresses = response.data?.addresses || []
        setSavedAddresses(addresses)
        const defaultAddress = addresses.find((entry) => entry.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setFormData({
            name: defaultAddress.name,
            phone: defaultAddress.phone,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode
          })
        }
      } catch (error) {
        // Fallback to manual entry if addresses are unavailable.
      }
    }

    if (isAuthenticated) {
      loadAddresses()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl font-bold mb-4">Please Sign In</h1>
          <button 
            onClick={() => navigate('/auth')}
            className="glass-button"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <button 
            onClick={() => navigate('/products/featured')}
            className="glass-button"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      // Create order
      const orderResponse = await ordersAPI.create({
        items: cartItems,
        totalAmount: total,
        shippingAddress: formData,
        couponCode: couponApplied?.code || null
      })

      const orderId = orderResponse.data.orderId
      const orderDbId = orderResponse.data.id
      trackEvent('order_created', {
        order_id: orderId,
        order_db_id: orderDbId,
        total_amount: Number(total.toFixed(2)),
        item_count: cartItems.length
      })

      // Create Razorpay order
      const paymentResponse = await paymentAPI.createOrder(total, orderId, paymentMethod)

      const upiOnlyConfig = {
        display: {
          blocks: {
            upi: {
              name: 'Pay with UPI',
              instruments: [{ method: 'upi' }]
            }
          },
          sequence: ['block.upi'],
          preferences: {
            show_default_blocks: false
          }
        }
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentResponse.data.amount,
        currency: paymentResponse.data.currency,
        order_id: paymentResponse.data.order_id,
        name: 'AURA',
        description: `Order ${orderId} (${paymentMethod === 'gpay' ? 'Google Pay' : 'Razorpay'})`,
        config: paymentMethod === 'gpay' ? upiOnlyConfig : undefined,
        notes: {
          payment_method: paymentMethod
        },
        handler: async (response) => {
          try {
            // Verify payment
            await paymentAPI.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )

            trackEvent('purchase', {
              order_id: orderId,
              payment_id: response.razorpay_payment_id,
              total_amount: Number(total.toFixed(2)),
              item_count: cartItems.length
            })

            // Clear cart and show success
            await clearCart()
            localStorage.removeItem('applied-coupon')
            setSuccess(true)
            setTimeout(() => navigate('/orders'), 2000)
          } catch (error) {
            trackEvent('payment_verification_failed', {
              order_id: orderId
            })
            alert('Payment verification failed')
          }
        },
        onDismiss: () => {
          trackEvent('payment_dismissed', {
            order_id: orderId
          })
          alert('Payment cancelled')
        },
        theme: {
          color: '#00F0FF'
        }
      }

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        alert('Razorpay key is missing. Please configure VITE_RAZORPAY_KEY_ID in frontend env.')
        return
      }

      if (!window.Razorpay || !isRazorpayReady) {
        trackEvent('payment_sdk_unavailable', {
          order_id: orderId
        })
        alert('Razorpay SDK failed to load. Please refresh and try again.')
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Failed to create order:', error)
      const serverMessage = error?.response?.data?.detail || error?.message || 'unknown_error'
      trackEvent('order_creation_failed', {
        error_message: serverMessage
      })
      alert(`Failed to create order: ${serverMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="font-heading text-4xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {['address', 'payment', 'confirm'].map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  step === s
                    ? 'bg-white text-black border border-white'
                    : 'bg-zinc-900 text-white border border-zinc-500'
                }`}
              >
                {idx + 1}
              </motion.div>
              {idx < 2 && <div className="flex-1 h-1 mx-2 bg-white/80"></div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-lg bg-black border border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={24} className="text-cyan-neon" />
                  <h2 className="font-heading text-2xl font-bold">Shipping Address</h2>
                </div>

                <form className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-body text-zinc-300 mb-2">Saved Addresses</label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => {
                          const address = savedAddresses.find((entry) => entry.id === e.target.value)
                          setSelectedAddressId(e.target.value)
                          if (address) {
                            setFormData({
                              name: address.name,
                              phone: address.phone,
                              address: address.address,
                              city: address.city,
                              state: address.state,
                              pincode: address.pincode
                            })
                          }
                        }}
                        className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white focus:outline-none focus:border-white"
                      >
                        <option value="">Select saved address</option>
                        {savedAddresses.map((entry) => (
                          <option key={entry.id} value={entry.id} className="bg-dark-bg">
                            {entry.label || 'Address'} - {entry.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-body text-zinc-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-body text-zinc-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-body text-zinc-300 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-body text-zinc-300 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body text-zinc-300 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-body text-zinc-300 mb-2">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-black border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      placeholder="400001"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="w-full mt-6 py-3 rounded-lg font-heading font-bold bg-black text-white hover:bg-zinc-800 transition"
                  >
                    Continue to Payment
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-lg bg-black border border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard size={24} className="text-cyan-neon" />
                  <h2 className="font-heading text-2xl font-bold">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`glass-panel p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'razorpay' ? 'border-cyan-neon' : 'border-zinc-700'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setPaymentMethod('razorpay')
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        name="payment-method"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-cyan-400"
                      />
                      <span className="font-heading font-bold">Razorpay (Cards, UPI, Net Banking)</span>
                    </div>
                    <p className="text-text-secondary text-sm ml-7">Credit Card, Debit Card, UPI, Net Banking</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('gpay')}
                    className={`glass-panel p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'gpay' ? 'border-cyan-neon' : 'border-zinc-700'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setPaymentMethod('gpay')
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="radio"
                        name="payment-method"
                        value="gpay"
                        checked={paymentMethod === 'gpay'}
                        onChange={() => setPaymentMethod('gpay')}
                        className="accent-cyan-400"
                      />
                      <span className="font-heading font-bold">Google Pay (UPI)</span>
                    </div>
                    <p className="text-text-secondary text-sm ml-7">Pay with your UPI app via Razorpay Checkout</p>
                  </div>

                  <p className="text-text-secondary text-sm mt-6">
                    ℹ️ Your order will be processed securely using Razorpay. For Google Pay, choose UPI in the payment sheet.
                  </p>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setStep('address')}
                      className="flex-1 py-3 rounded-lg font-heading font-semibold bg-zinc-200 text-black hover:bg-zinc-300 transition"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep('confirm')}
                      className="flex-1 py-3 rounded-lg font-heading font-bold bg-black text-white hover:bg-zinc-800 transition"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-lg bg-black border border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Package size={24} className="text-cyan-neon" />
                  <h2 className="font-heading text-2xl font-bold">Order Review</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="pb-4 border-b border-cyan-neon/20">
                    <h3 className="font-heading font-bold mb-3">Shipping To:</h3>
                    <p className="text-text-secondary text-sm">
                      {formData.name}<br/>
                      {formData.address}<br/>
                      {formData.city}, {formData.state} {formData.pincode}<br/>
                      {formData.phone}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-cyan-neon/20">
                    <h3 className="font-heading font-bold mb-3">Order Items:</h3>
                    <div className="space-y-2 text-sm text-text-secondary">
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.productId} x {item.quantity} ({item.size})</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || success || !isRazorpayReady}
                  className="w-full py-3 rounded-lg font-heading font-bold bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-500 transition"
                >
                  {loading ? 'Processing...' : isRazorpayReady ? 'Place Order & Pay' : 'Loading payment gateway...'}
                </button>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full mt-3 py-3 rounded-lg font-heading font-semibold bg-zinc-200 text-black hover:bg-zinc-300 transition"
                >
                  ← Back
                </button>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 h-fit sticky top-24 rounded-lg bg-black border border-zinc-800"
          >
            <h2 className="font-heading text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-cyan-neon/20 max-h-64 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.productId} x {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon ({couponApplied.code})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Tax (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className="text-cyan-neon">Free</span>
              </div>
            </div>

            <div className="border-t border-cyan-neon/20 pt-6">
              <div className="flex justify-between mb-4">
                <span className="font-heading font-bold text-lg">Total</span>
                <span className="neon-text font-bold text-2xl">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Order placed successfully!
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

    </div>
  )
}
