import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { productsAPI } from '../utils/api'
import ProductCard from '../components/ProductCard'
import { motion } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')

const tokenize = (value) => normalizeText(value).split(/\s+/).filter(Boolean)

const hasAnyToken = (tokens, candidates) => candidates.some((candidate) => tokens.includes(candidate))

const isClothingProduct = (product) => {
  const category = normalizeText(product?.category)
  return ['fashion', 'clothing', 'apparel'].some((term) => category.includes(term))
}

const isMenClothing = (product) => {
  const genderTokens = tokenize(`${product?.subcategory || ''} ${product?.category || ''}`)
  const hasMenToken = hasAnyToken(genderTokens, ['men', 'mens', 'male'])
  const hasWomenToken = hasAnyToken(genderTokens, ['women', 'womens', 'female', 'ladies'])
  return isClothingProduct(product) && hasMenToken && !hasWomenToken
}

const isWomenClothing = (product) => {
  const genderTokens = tokenize(`${product?.subcategory || ''} ${product?.category || ''}`)
  const hasWomenToken = hasAnyToken(genderTokens, ['women', 'womens', 'female', 'ladies'])
  return isClothingProduct(product) && hasWomenToken
}

export default function Products() {
  const { category } = useParams()
  const normalizedCategory = String(category || '').toLowerCase()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [showFilters, setShowFilters] = useState(true)

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const isSpecialCategory = ['men', 'women', 'new', 'new-collection', 'featured'].includes(normalizedCategory)

        let filtered = []

        if (normalizedCategory === 'featured') {
          const response = await productsAPI.getFeatured(60)
          filtered = response.data
        } else {
          const response = await productsAPI.getAll(isSpecialCategory ? null : category, search, 80, 0)
          filtered = response.data

          if (normalizedCategory === 'men') {
            filtered = filtered.filter(isMenClothing)
          }

          if (normalizedCategory === 'women') {
            filtered = filtered.filter(isWomenClothing)
          }

          if (normalizedCategory === 'new' || normalizedCategory === 'new-collection') {
            filtered = [...filtered].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
          }
        }

        // Filter by price
        filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

        // Filter by selected sizes
        if (selectedSizes.length > 0) {
          filtered = filtered.filter((p) =>
            Array.isArray(p.sizes) && p.sizes.some((size) => selectedSizes.includes(size))
          )
        }

        // Sort
        if (sortBy === 'price-low') {
          filtered.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price-high') {
          filtered.sort((a, b) => b.price - a.price)
        } else if (sortBy === 'newest') {
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }

        setProducts(filtered)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [category, normalizedCategory, search, sortBy, priceRange, selectedSizes])

  const categoryLabel =
    normalizedCategory === 'new-collection'
      ? 'New Collection'
      : normalizedCategory || 'All Products'

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-black text-zinc-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="font-heading text-5xl font-bold mb-4 capitalize text-white">{categoryLabel}</h1>
            <p className="text-zinc-400 text-lg">{products.length} items</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-sm"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Search & Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className={`${showFilters ? 'block' : 'hidden'} md:block md:col-span-1`}
          >
            <div className="space-y-6 md:sticky md:top-24">
              {/* Search */}
              <div>
                <label className="block font-heading font-bold mb-3 text-zinc-100">Search</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="block font-heading font-bold mb-3 text-zinc-100">Price Range</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2 text-sm"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="number"
                      min="0"
                      max="50000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2 text-sm"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full"
                  />
                  <p className="text-zinc-400 text-sm">₹{priceRange[0]} - ₹{priceRange[1]}</p>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block font-heading font-bold mb-3 text-zinc-100">Sizes</label>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`py-2 rounded-sm font-medium text-sm transition ${
                        selectedSizes.includes(size)
                          ? 'bg-cyan-neon text-black'
                          : 'bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(search || priceRange[0] > 0 || priceRange[1] < 50000 || selectedSizes.length > 0) && (
                <button
                  onClick={() => {
                    setSearch('')
                    setPriceRange([0, 50000])
                    setSelectedSizes([])
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 transition"
                >
                  <X size={16} /> Clear Filters
                </button>
              )}
            </div>
          </motion.div>

          {/* Products Section */}
          <div className="md:col-span-3">
            {/* Sort Controls */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-zinc-400">Showing {products.length} products</p>
              <div className="flex items-center gap-2">
                <label className="text-zinc-400 text-sm">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-pulse-neon text-cyan-neon text-2xl">Loading...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-lg mb-4">No products found</p>
                <button
                  onClick={() => {
                    setSearch('')
                    setPriceRange([0, 50000])
                    setSelectedSizes([])
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-6 py-2 rounded-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
