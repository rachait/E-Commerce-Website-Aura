import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { productsAPI, ordersAPI, analyticsAPI, authAPI } from '../utils/api'
import { motion } from 'framer-motion'
import { Package, ShoppingBag, Users, TrendingUp, Plus, Edit, Trash2, Upload, X } from 'lucide-react'
import { AURA_IMAGE_FALLBACK } from '../utils/images'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'fashion',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: '',
    images: [],
    rating: 5
  })

  const categories = ['fashion', 'accessories', 'footwear', 'bags', 'makeup']
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  // Fetch products and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const prodRes = await productsAPI.getAll('all', '', 100)
        setProducts(prodRes.data || [])

        const ordRes = await ordersAPI.getAllAdmin()
        setOrders(ordRes.data || [])

        const usersRes = await authAPI.getAdminUsers(100, 0, '')
        setUsers(usersRes.data?.users || [])

        const analyticsRes = await analyticsAPI.getAdminOverview()
        setOverview(analyticsRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center min-h-96 flex flex-col justify-center">
          <h1 className="font-heading text-4xl font-bold mb-4">Access Denied</h1>
          <p className="text-text-secondary mb-6">You need admin privileges to access this page</p>
          <button 
            onClick={() => navigate('/')}
            className="inline-block bg-cyan-neon text-black px-8 py-3 rounded-sm font-bold w-fit mx-auto"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result
        if (typeof imageDataUrl !== 'string') return

        setImagePreview(imageDataUrl)
        setFormData(prev => ({
          ...prev,
          // Store a renderable URL instead of the raw File object name.
          images: [imageDataUrl, ...prev.images]
        }))
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : Number(formData.price),
        stock: Number(formData.stock),
        images: formData.images.length > 0 
          ? formData.images.filter((img) => typeof img === 'string' && img.trim() !== '')
          : ['https://via.placeholder.com/400x500']
      }

      await productsAPI.create(payload)
      alert('Product added successfully!')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'fashion',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: '',
        images: [],
        rating: 5
      })
      setImagePreview(null)
      setShowProductForm(false)

      const res = await productsAPI.getAll('all', '', 100)
      setProducts(res.data || [])
    } catch (error) {
      console.error('Failed to add product:', error)
      alert('Failed to add product: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await productsAPI.delete(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      alert('Product deleted successfully')
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-5xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary">Manage products, orders, and store analytics</p>
        </motion.div>

        {/* Stats Grid */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Package, label: 'Total Products', value: overview?.products?.count ?? products.length, color: 'cyan' },
              { icon: ShoppingBag, label: 'Total Orders', value: overview?.orders?.total ?? orders.length, color: 'purple' },
              { icon: TrendingUp, label: 'Total Revenue', value: '₹' + (overview?.revenue?.total ?? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)).toLocaleString(), color: 'green' },
              { icon: Users, label: 'Total Users', value: overview?.customers?.count ?? users.length, color: 'blue' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-text-secondary/20 rounded-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-text-secondary text-sm font-body">{stat.label}</h3>
                  <stat.icon className="text-cyan-neon opacity-50" size={24} />
                </div>
                <p className="neon-text font-heading text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border border-text-secondary/20 rounded-sm overflow-hidden">
          <div className="flex border-b border-text-secondary/20 bg-dark-surface">
            {['dashboard', 'products', 'orders', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-heading font-bold capitalize transition ${
                  activeTab === tab
                    ? 'text-cyan-neon border-b-2 border-cyan-neon'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Recent Orders</h2>
                  {orders.slice(0, 5).length === 0 ? (
                    <p className="text-text-secondary">No orders yet</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="border border-text-secondary/20 rounded-sm p-4 flex items-center justify-between hover:border-cyan-neon/30 transition">
                          <div>
                            <p className="font-body font-600">Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                            <p className="text-text-secondary text-sm">₹{order.totalAmount?.toFixed(2)} • {order.status}</p>
                          </div>
                          <span className={`text-sm font-medium px-3 py-1 rounded-sm ${
                            order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                            order.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Low Stock Items</h2>
                  <div className="space-y-3">
                    {products.filter(p => p.stock <= 5 && p.stock > 0).slice(0, 5).length === 0 ? (
                      <p className="text-text-secondary">All items in good stock</p>
                    ) : (
                      products.filter(p => p.stock <= 5 && p.stock > 0).slice(0, 5).map((product) => (
                        <div key={product.id} className="border border-text-secondary/20 rounded-sm p-4 flex items-center justify-between">
                          <div>
                            <p className="font-body font-600">{product.name}</p>
                            <p className="text-text-secondary text-sm">{product.category}</p>
                          </div>
                          <p className="font-bold text-orange-400">{product.stock} units</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-heading text-2xl font-bold">Products ({products.length})</h2>
                  <button
                    onClick={() => setShowProductForm(!showProductForm)}
                    className="bg-cyan-neon text-black px-6 py-2 rounded-sm flex items-center gap-2 font-bold hover:bg-pink-neon transition"
                  >
                    <Plus size={18} />
                    Add Product
                  </button>
                </div>

                {/* Product Form */}
                {showProductForm && (
                  <motion.form
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddProduct}
                    className="border border-text-secondary/20 rounded-sm p-8 mb-8 space-y-6"
                  >
                    {/* Basic Info */}
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter product name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Category *</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary focus:outline-none focus:border-cyan-neon"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat} className="bg-dark-bg">{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                          name="description"
                          placeholder="Enter product description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                          rows="4"
                          required
                        />
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Price (₹) *</label>
                          <input
                            type="number"
                            name="price"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Original Price (₹)</label>
                          <input
                            type="number"
                            name="originalPrice"
                            placeholder="For discounts"
                            value={formData.originalPrice}
                            onChange={handleInputChange}
                            className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Stock *</label>
                          <input
                            type="number"
                            name="stock"
                            placeholder="0"
                            value={formData.stock}
                            onChange={handleInputChange}
                            className="w-full bg-dark-surface border border-text-secondary/20 rounded-sm p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4">Available Sizes</h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {sizeOptions.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`py-2 px-2 rounded-sm font-medium text-sm transition ${
                              formData.sizes.includes(size)
                                ? 'bg-cyan-neon text-black'
                                : 'bg-dark-surface border border-text-secondary/20 hover:border-cyan-neon'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <h3 className="font-heading font-bold text-lg mb-4">Product Images</h3>
                      <div className="border-2 border-dashed border-text-secondary/30 rounded-sm p-6 text-center hover:border-cyan-neon transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer block">
                          <Upload className="mx-auto mb-2 text-text-secondary" size={32} />
                          <p className="font-medium mb-1">Click to upload or drag and drop</p>
                          <p className="text-text-secondary text-sm">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="mt-4 relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = AURA_IMAGE_FALLBACK
                            }}
                            className="h-32 rounded-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null)
                              setFormData(prev => ({ ...prev, images: [] }))
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-cyan-neon text-black rounded-sm font-bold hover:bg-pink-neon transition disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add Product'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductForm(false)
                          setFormData({
                            name: '',
                            description: '',
                            price: '',
                            originalPrice: '',
                            category: 'fashion',
                            sizes: ['XS', 'S', 'M', 'L', 'XL'],
                            stock: '',
                            images: [],
                            rating: 5
                          })
                          setImagePreview(null)
                        }}
                        className="flex-1 py-3 border border-text-secondary/30 rounded-sm font-bold hover:border-cyan-neon hover:bg-cyan-neon/5 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Products List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse-neon text-cyan-neon">Loading products...</div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary mb-4">No products added yet</p>
                    <button
                      onClick={() => setShowProductForm(true)}
                      className="bg-cyan-neon text-black px-6 py-2 rounded-sm font-bold hover:bg-pink-neon transition"
                    >
                      Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="border border-text-secondary/20 rounded-sm p-4 flex items-center justify-between hover:border-cyan-neon/30 transition">
                        <div className="flex items-center gap-4 flex-1">
                          <img 
                            src={product.images?.[0] || AURA_IMAGE_FALLBACK}
                            alt={product.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = AURA_IMAGE_FALLBACK
                            }}
                            className="w-16 h-16 object-cover rounded-sm"
                          />
                          <div className="flex-1">
                            <p className="font-body font-bold">{product.name}</p>
                            <p className="text-text-secondary text-sm">₹{product.price?.toFixed(2)} • {product.stock} stock • {product.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 rounded-sm border border-text-secondary/20 hover:border-cyan-neon transition">
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 rounded-sm border border-text-secondary/20 hover:border-red-500 transition"
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="font-heading text-2xl font-bold mb-6">Orders Management ({orders.length})</h2>
                {orders.length === 0 ? (
                  <p className="text-text-secondary">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-text-secondary/20 rounded-sm p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-body font-bold">Order #{order.id?.slice(0, 8).toUpperCase()}</p>
                          <p className="text-text-secondary text-sm">₹{order.totalAmount?.toFixed(2)} • {order.items?.length || 0} items</p>
                        </div>
                        <select
                          defaultValue={order.status || 'pending'}
                          className="bg-dark-surface border border-text-secondary/20 rounded-sm p-2 text-sm focus:outline-none focus:border-cyan-neon"
                          onChange={(e) => {
                            // Update order status
                            ordersAPI.updateStatus(order.id, e.target.value)
                              .catch(err => alert('Failed to update status'))
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="font-heading text-2xl font-bold mb-6">Users Management ({users.length})</h2>
                {users.length === 0 ? (
                  <p className="text-text-secondary">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((entry) => (
                      <div key={entry.id} className="border border-text-secondary/20 rounded-sm p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-body font-bold">{entry.name || 'Unnamed User'}</p>
                          <p className="text-text-secondary text-sm">{entry.email}</p>
                          <p className="text-text-secondary text-xs mt-1">
                            Joined: {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm capitalize">{entry.role}</p>
                          <p className={`text-xs ${entry.emailVerified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {entry.emailVerified ? 'Verified' : 'Not verified'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
