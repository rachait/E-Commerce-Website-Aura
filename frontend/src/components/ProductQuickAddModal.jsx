import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { AURA_IMAGE_FALLBACK, getProductImageCandidates } from '../utils/images'

const QUICK_ADD_IMAGE_FALLBACK = AURA_IMAGE_FALLBACK

export default function ProductQuickAddModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || '')
  const [selectedColor, setSelectedColor] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const { addToCart } = useCart()
  const imageCandidates = useMemo(() => {
    const candidates = getProductImageCandidates(product)
    return candidates.length > 0 ? candidates : [QUICK_ADD_IMAGE_FALLBACK]
  }, [product])
  const mainImage = imageCandidates[imageIndex] || QUICK_ADD_IMAGE_FALLBACK

  useEffect(() => {
    setImageIndex(0)
    setSelectedSize(product?.sizes?.[0] || '')
  }, [product])

  const requiresSizeSelection = Array.isArray(product?.sizes) && product.sizes.length > 0

  const colors = ['Black', 'White', 'Navy', 'Gray', 'Cream']

  const handleAddToCart = async () => {
    if (requiresSizeSelection && !selectedSize) {
      alert('Please select a size')
      return
    }

    setIsAdding(true)
    try {
      await addToCart(product.id, quantity, requiresSizeSelection ? selectedSize : '')
      setConfirmMessage('Added to cart!')
      setTimeout(() => {
        onClose()
        setConfirmMessage('')
      }, 1500)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-zinc-200 bg-white">
                <h2 className="font-bold text-xl text-zinc-900">Quick Add</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 rounded transition"
                  aria-label="Close"
                >
                  <X size={20} className="text-zinc-900" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Product Image */}
                <div className="h-48 bg-zinc-100 rounded overflow-hidden">
                  <img
                    src={mainImage}
                    alt={product?.name}
                    onError={(e) => {
                      if (imageIndex < imageCandidates.length - 1) {
                        setImageIndex((prev) => prev + 1)
                        return
                      }
                      e.currentTarget.onerror = null
                      e.currentTarget.src = QUICK_ADD_IMAGE_FALLBACK
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 mb-2">{product?.name}</h3>
                  <p className="text-zinc-600 text-sm mb-4">{product?.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900">₹{product?.price}</span>
                    {product?.originalPrice && (
                      <span className="text-sm text-zinc-500 line-through">₹{product?.originalPrice}</span>
                    )}
                  </div>
                </div>

                {/* Size Selection */}
                {requiresSizeSelection && (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-[0.1em]">
                      Size
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {product?.sizes?.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 rounded border font-medium transition ${
                            selectedSize === size
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-900'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-[0.1em]">
                    Color (Optional)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`py-2 rounded border text-xs font-medium transition ${
                          selectedColor === color
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-900'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-[0.1em]">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4 border border-zinc-300 w-fit rounded">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 hover:bg-zinc-100 transition"
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} className={quantity <= 1 ? 'text-zinc-300' : 'text-zinc-900'} />
                    </button>
                    <span className="font-bold text-lg text-zinc-900 w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 hover:bg-zinc-100 transition"
                      disabled={quantity >= 10}
                    >
                      <Plus size={18} className={quantity >= 10 ? 'text-zinc-300' : 'text-zinc-900'} />
                    </button>
                  </div>
                </div>

                {/* Stock Info */}
                {product?.stock && (
                  <div className="text-sm text-zinc-600">
                    {product.stock > 5 ? (
                      <span className="text-green-600 font-medium">In Stock ({product.stock})</span>
                    ) : (
                      <span className="text-orange-600 font-medium">Only {product.stock} left</span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 border-t border-zinc-200 p-6 bg-white space-y-3">
                {confirmMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center text-green-600 font-semibold text-sm"
                  >
                    ✓ {confirmMessage}
                  </motion.div>
                )}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || (requiresSizeSelection && !selectedSize)}
                  className={`w-full py-3 rounded font-bold text-white flex items-center justify-center gap-2 transition ${
                    isAdding || (requiresSizeSelection && !selectedSize)
                      ? 'bg-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-700'
                  }`}
                >
                  <ShoppingBag size={18} />
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded font-bold text-zinc-900 border border-zinc-300 hover:bg-zinc-50 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
