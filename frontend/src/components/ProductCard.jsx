import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import ProductQuickAddModal from './ProductQuickAddModal'
import { getProductImageCandidates } from '../utils/images'
import { cloudinaryUrl } from '../utils/cloudinary'

const PRODUCT_IMAGE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#0f1720"/><text x="50%" y="50%" fill="#f3f4f6" font-size="32" text-anchor="middle" dominant-baseline="middle" font-family="Arial">AURA</text></svg>'
)}`

function ProductCard({ product }) {
  const { isAuthenticated } = useAuth()
  const { isInWishlist, addToWishlist } = useWishlist()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const imageCandidates = useMemo(() => {
    const candidates = getProductImageCandidates(product)
    return candidates.length > 0 ? candidates : [PRODUCT_IMAGE_FALLBACK]
  }, [product])
  const transformedCandidates = useMemo(() => {
    // apply Cloudinary transforms when possible for better performance and consistent crops
    try {
      return imageCandidates.map((c) => cloudinaryUrl(c))
    } catch (e) {
      return imageCandidates
    }
  }, [imageCandidates])

  const [imageIndex, setImageIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState(transformedCandidates[0] || imageCandidates[0])
  const inWishlist = isInWishlist(product.id)

  useEffect(() => {
    setImageIndex(0)
    setImageSrc(transformedCandidates[0] || imageCandidates[0])
  }, [transformedCandidates, imageCandidates])

  const handleImageError = useCallback(() => {
    if (imageIndex < imageCandidates.length - 1) {
      const nextIndex = imageIndex + 1
      setImageIndex(nextIndex)
      setImageSrc(imageCandidates[nextIndex])
      return
    }

    setImageSrc(PRODUCT_IMAGE_FALLBACK)
  }, [imageCandidates, imageIndex])

  const handleWishlistToggle = useCallback((e) => {
    e.preventDefault()
    addToWishlist(product)
  }, [addToWishlist, product])

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group"
    >
      <div className="relative product-img-wrap rounded-sm mb-4 h-80 bg-zinc-900 border border-white/5">
        <img 
          src={imageSrc}
          alt={product.name}
          onError={handleImageError}
          className="product-img w-full h-full object-cover"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Action Buttons - Bottom Right */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault()
              if (!isAuthenticated) {
                alert('Please sign in to add items')
                return
              }
              setShowQuickAdd(true)
            }}
            className="bg-white/95 backdrop-blur-sm hover:bg-white text-zinc-900 px-4 py-2 rounded-sm font-bold text-sm flex items-center gap-2 transition shadow-lg"
          >
            <ShoppingBag size={16} />
            Add
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistToggle}
            className={`rounded-sm p-2 backdrop-blur-sm transition shadow-lg ${
              inWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white/95 hover:bg-white text-zinc-900'
            }`}
          >
            <motion.div
              animate={{ scale: inWishlist ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Stock Badge */}
        {product.stock && product.stock <= 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-sm text-xs font-bold tracking-wide">
            OUT OF STOCK
          </div>
        )}

        {/* Sale Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 right-3 bg-zinc-900 text-white px-3 py-1 rounded-sm text-xs font-bold">
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <Link to={`/product/${product.id}`} className="block">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
          {product.subcategory || product.category || 'New'}
        </p>
        <h3 className="font-bold text-base mb-2 line-clamp-2 text-white hover:text-zinc-300 transition">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-lg text-white">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-zinc-500 line-through">₹{product.originalPrice}</span>
          )}
        </div>

        {/* Stock Info */}
        {product.stock && product.stock > 0 && (
          <p className="text-xs text-zinc-500 mt-2">
            {product.stock > 5 ? 'In Stock' : `Only ${product.stock} left`}
          </p>
        )}
      </Link>

      {/* Quick Add Modal */}
      <ProductQuickAddModal
        product={product}
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </motion.div>
  )
}

export default memo(ProductCard)
