import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productsAPI, ordersAPI } from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Heart, Share2, Star, Plus, Minus, ShoppingBag } from 'lucide-react'
import { AURA_IMAGE_FALLBACK, getProductImageCandidates } from '../utils/images'
import { trackEvent } from '../utils/analytics'

const PRODUCT_IMAGE_FALLBACK = AURA_IMAGE_FALLBACK

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const requiresSizeSelection = Array.isArray(product?.sizes) && product.sizes.length > 0

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          productsAPI.getById(id),
          productsAPI.getReviews(id, 20)
        ])

        const response = productRes
        setProduct(response.data)
        setMainImageIndex(0)
        setReviews(reviewsRes.data || [])
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0])
        }

        productsAPI.trackView(id).catch(() => {})
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    if (!reviewComment.trim()) {
      alert('Please write a review comment')
      return
    }

    try {
      setSubmittingReview(true)
      await productsAPI.addReview(id, reviewRating, reviewComment.trim())
      const reviewsRes = await productsAPI.getReviews(id, 20)
      setReviews(reviewsRes.data || [])
      setReviewComment('')
      setReviewRating(5)
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    if (requiresSizeSelection && !selectedSize) {
      alert('Please select a size')
      return
    }

    try {
      setAdding(true)
      await addToCart(product.id, quantity, requiresSizeSelection ? selectedSize : '')
      trackEvent('add_to_cart', {
        source: 'product_detail',
        product_id: product.id,
        quantity,
        size: requiresSizeSelection ? selectedSize : null,
        price: product.price
      })
      setSuccess('Added to cart!')
      setTimeout(() => setSuccess(''), 2000)
      setQuantity(1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 flex justify-center items-center min-h-screen">
        <div className="animate-pulse-neon text-cyan-neon text-xl">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl font-bold mb-4">Product Not Found</h1>
          <button 
            onClick={() => navigate('/products/featured')}
            className="glass-button"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const imageCandidates = getProductImageCandidates(product)
  const mainImageSrc = imageCandidates[mainImageIndex] || PRODUCT_IMAGE_FALLBACK

  const handleMainImageError = (e) => {
    if (mainImageIndex < imageCandidates.length - 1) {
      setMainImageIndex((prev) => prev + 1)
      return
    }

    e.currentTarget.onerror = null
    e.currentTarget.src = PRODUCT_IMAGE_FALLBACK
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-cyan-neon mb-6 transition"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Main Image */}
            <div className="rounded-sm aspect-square flex items-center justify-center overflow-hidden group bg-dark-surface">
              <img 
                src={mainImageSrc}
                alt={product.name}
                onError={handleMainImageError}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>

            {/* Thumbnail Gallery */}
            {imageCandidates.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imageCandidates.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setMainImageIndex(idx)}
                    className={`w-20 h-20 rounded-sm cursor-pointer transition bg-dark-surface flex-shrink-0 ${
                      mainImageIndex === idx ? 'border-2 border-cyan-neon' : 'hover:border-2 hover:border-cyan-neon'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${idx}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = PRODUCT_IMAGE_FALLBACK
                      }}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-between"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-cyan-neon text-sm font-heading font-bold uppercase mb-2">
                    {product.category}
                  </p>
                  <h1 className="font-heading text-4xl font-bold mb-4">{product.name}</h1>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 glass-panel hover:border-cyan-neon transition rounded-lg">
                    <Heart size={20} />
                  </button>
                  <button className="p-3 glass-panel hover:border-cyan-neon transition rounded-lg">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Rating & Price */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cyan-neon/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-cyan-neon fill-current" />
                  ))}
                </div>
                <span className="text-text-secondary text-sm">({reviews.length || product.ratingCount || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="neon-text font-display text-4xl font-bold">₹{product.price}</span>
                  <span className="text-text-secondary line-through">₹{(product.price * 1.2).toFixed(0)}</span>
                  <span className="text-green-400 text-sm">20% OFF</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-text-secondary leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="mb-6">
                <p className={`text-sm font-body font-600 ${product.stock > 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-heading font-bold mb-3">Select Size</label>
                <div className="flex gap-3 flex-wrap">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border transition ${
                        selectedSize === size
                          ? 'glass-panel border-cyan-neon bg-cyan-neon/10'
                          : 'border-text-secondary/30 hover:border-cyan-neon'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex gap-4">
              {/* Quantity */}
              <div className="glass-panel flex items-center justify-between px-4 py-3 rounded-lg w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="hover:text-cyan-neon transition"
                >
                  <Minus size={18} />
                </button>
                <span className="font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="hover:text-cyan-neon transition"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={adding || !product.stock}
                className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-heading font-bold bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-500 transition"
              >
                <ShoppingBag size={20} />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-3 glass-panel border border-green-500/50 text-green-400 text-sm rounded-lg text-center"
              >
                ✓ {success}
              </motion.div>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-cyan-neon/20 space-y-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Free Shipping</span>
                <span className="text-cyan-neon">On orders over ₹1000</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>30-Day Returns</span>
                <span className="text-cyan-neon">No questions asked</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Secure Checkout</span>
                <span className="text-cyan-neon">Razorpay encrypted</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="mt-20 pt-12 border-t border-cyan-neon/20">
          <h2 className="font-heading text-3xl font-bold mb-8">Reviews</h2>

          <div className="glass-panel p-5 rounded-lg mb-8">
            <p className="text-sm text-text-secondary mb-3">Share your experience</p>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setReviewRating(value)}
                  className="p-1"
                >
                  <Star
                    size={18}
                    className={value <= reviewRating ? 'text-cyan-neon fill-current' : 'text-zinc-500'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="Write your review"
              className="w-full glass-panel p-3 rounded text-text-primary placeholder-text-secondary"
            />
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="mt-3 px-5 py-2 bg-cyan-neon text-black rounded-sm font-bold disabled:opacity-60"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-text-secondary">No reviews yet. Be the first to review.</p>
            ) : (
              reviews.map((entry) => (
                <div key={entry.id} className="glass-panel rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">{entry.userName || 'User'}</p>
                    <p className="text-xs text-text-secondary">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < entry.rating ? 'text-cyan-neon fill-current' : 'text-zinc-600'} />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary">{entry.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-20 pt-12 border-t border-cyan-neon/20">
          <h2 className="font-heading text-3xl font-bold mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Placeholder for related products */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="glass-panel p-4 rounded-lg animate-pulse">
                <div className="w-full h-64 bg-dark-surface rounded mb-4"></div>
                <div className="h-4 bg-dark-surface rounded mb-2"></div>
                <div className="h-4 bg-dark-surface rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
