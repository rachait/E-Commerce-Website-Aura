import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { productsAPI, couponsAPI } from '../utils/api'
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { AURA_IMAGE_FALLBACK, getProductImageCandidates } from '../utils/images'
import { trackEvent } from '../utils/analytics'

const CART_IMAGE_FALLBACK = AURA_IMAGE_FALLBACK

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateCart, loading } = useCart()
  const { isAuthenticated } = useAuth()
  const [productDetails, setProductDetails] = useState({})
  const [updatingItems, setUpdatingItems] = useState(new Set())
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(null)

  // Fetch product details for images
  useEffect(() => {
    const fetchProductDetails = async () => {
      const cartItems = cart?.items || []
      const details = {}
      for (const item of cartItems) {
        if (!productDetails[item.productId]) {
          try {
            const response = await productsAPI.getById(item.productId)
            details[item.productId] = response.data
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error)
          }
        }
      }
      setProductDetails(prev => ({ ...prev, ...details }))
    }
    if (cart?.items?.length > 0) {
      fetchProductDetails()
    }
  }, [cart])

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center min-h-96 flex flex-col justify-center">
          <ShoppingCart size={72} className="mx-auto mb-6 text-text-secondary opacity-50" />
          <h1 className="font-heading text-4xl font-bold mb-4">Sign In to View Cart</h1>
          <p className="text-text-secondary text-lg mb-8">Add items to your cart and complete your purchase</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/auth')}
              className="bg-cyan-neon text-black px-8 py-3 rounded-sm font-bold hover:bg-pink-neon transition"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/products/featured')}
              className="border border-cyan-neon px-8 py-3 rounded-sm font-bold hover:bg-cyan-neon/10 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  const cartItems = cart?.items || []
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const couponDiscount = Number(couponApplied?.discountAmount || 0)
  const discountedSubtotal = Math.max(totalAmount - couponDiscount, 0)
  const taxAmount = discountedSubtotal * 0.18
  const finalTotal = discountedSubtotal + taxAmount

  const handleProceedToCheckout = () => {
    trackEvent('begin_checkout', {
      item_count: cartItems.length,
      order_value: Number(finalTotal.toFixed(2))
    })
    navigate('/checkout')
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return
    }

    try {
      const response = await couponsAPI.validate(couponCode.trim(), totalAmount)
      if (response.data.valid) {
        setCouponApplied(response.data)
        localStorage.setItem('applied-coupon', JSON.stringify(response.data))
      } else {
        alert(response.data.message || 'Invalid coupon')
      }
    } catch (error) {
      alert(error?.response?.data?.detail || 'Failed to apply coupon')
    }
  }

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    setUpdatingItems(prev => new Set([...prev, productId]))
    try {
      await updateCart(productId, newQuantity)
    } catch (error) {
      console.error('Failed to update cart:', error)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 flex justify-center items-center min-h-screen">
        <div className="animate-pulse-neon text-cyan-neon text-2xl">Loading cart...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center min-h-96 flex flex-col justify-center">
          <ShoppingCart size={72} className="mx-auto mb-6 text-text-secondary opacity-50" />
          <h1 className="font-heading text-4xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-text-secondary text-lg mb-8">Discover our latest collections and add items to your cart</p>
          <button 
            onClick={() => navigate('/products/featured')}
            className="inline-block bg-cyan-neon text-black px-8 py-3 rounded-sm font-bold hover:bg-pink-neon transition w-fit mx-auto"
          >
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-cyan-neon transition mb-6"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="font-heading text-5xl font-bold">Shopping Bag</h1>
          <p className="text-text-secondary text-lg mt-2">{cartItems.length} items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div className="space-y-4">
              {cartItems.map((item, index) => {
                const product = productDetails[item.productId]
                const imageCandidates = getProductImageCandidates(product)
                const imageUrl = imageCandidates[0] || CART_IMAGE_FALLBACK
                
                return (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-text-secondary/20 rounded-sm p-6 hover:border-cyan-neon/30 transition flex gap-6"
                  >
                    {/* Product Image */}
                    <div className="w-32 h-40 flex-shrink-0 rounded-sm overflow-hidden bg-dark-surface">
                      <img
                        src={imageUrl}
                        data-image-index="0"
                        alt={product?.name || item.productId}
                        onError={(e) => {
                          const currentIndex = Number(e.currentTarget.dataset.imageIndex || '0')
                          const nextImage = imageCandidates[currentIndex + 1]
                          if (nextImage) {
                            e.currentTarget.dataset.imageIndex = String(currentIndex + 1)
                            e.currentTarget.src = nextImage
                            return
                          }

                          e.currentTarget.onerror = null
                          e.currentTarget.src = CART_IMAGE_FALLBACK
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-heading font-bold text-lg hover:text-cyan-neon transition cursor-pointer">
                            {product?.name || item.productId}
                          </h3>
                          <p className="text-text-secondary text-sm mt-1">{product?.description}</p>
                          <div className="mt-3 space-y-1 text-sm text-text-secondary">
                            <p>Size: <span className="text-text-primary font-medium">{item.size || 'N/A'}</span></p>
                            <p>SKU: <span className="text-text-primary font-medium">{product?.sku || 'N/A'}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-text-secondary hover:text-red-400 transition p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Quantity Controls & Price */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-dark-bg p-2 rounded-sm">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={updatingItems.has(item.productId) || item.quantity <= 1}
                            className="p-1 hover:text-cyan-neon disabled:opacity-50 transition"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-6 text-center font-heading font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={updatingItems.has(item.productId)}
                            className="p-1 hover:text-cyan-neon disabled:opacity-50 transition"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary text-sm">Price per item</p>
                          <p className="font-heading font-bold text-xl">₹{item.price?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary text-sm">Total</p>
                          <p className="neon-text font-heading font-bold text-2xl">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="border border-text-secondary/20 rounded-sm p-8">
              <h2 className="font-heading text-2xl font-bold mb-8">Order Summary</h2>

              <div className="space-y-4 mb-8 pb-8 border-b border-text-secondary/20">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-body">₹{totalAmount.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon ({couponApplied.code})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-body font-medium">Free</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Tax (18%)</span>
                  <span className="font-body">₹{taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8 pb-8 border-b border-text-secondary/20">
                <span className="font-heading font-bold text-lg">Total</span>
                <span className="neon-text font-heading font-bold text-3xl">₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                <label className="text-sm text-text-secondary block mb-2">Apply Coupon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 bg-dark-surface border border-text-secondary/30 rounded-sm px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 border border-cyan-neon rounded-sm text-sm hover:bg-cyan-neon/10"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-cyan-neon text-black py-4 rounded-sm font-heading font-bold text-lg hover:bg-pink-neon transition-all duration-300 mb-4"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate('/products/featured')}
                className="w-full border border-text-secondary/30 py-3 rounded-sm font-body hover:border-cyan-neon hover:bg-cyan-neon/5 transition text-text-secondary hover:text-text-primary"
              >
                Continue Shopping
              </button>

              <p className="text-text-secondary text-xs text-center mt-6">
                Free shipping on orders over ₹1000
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
