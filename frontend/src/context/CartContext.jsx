import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const fetchCart = async () => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/api/cart`)
      setCart(response.data)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId, quantity, size) => {
    if (!token) return
    try {
      await axios.post(`${BACKEND_URL}/api/cart/add`, {
        productId,
        quantity,
        size
      })
      await fetchCart()
    } catch (error) {
      throw error.response?.data || error
    }
  }

  const updateCart = async (productId, quantity) => {
    if (!token) return
    try {
      await axios.put(`${BACKEND_URL}/api/cart/update`, {
        productId,
        quantity
      })
      await fetchCart()
    } catch (error) {
      throw error.response?.data || error
    }
  }

  const removeFromCart = async (productId) => {
    if (!token) return
    try {
      await axios.delete(`${BACKEND_URL}/api/cart/remove/${productId}`)
      await fetchCart()
    } catch (error) {
      throw error.response?.data || error
    }
  }

  const clearCart = async () => {
    if (!token) return
    try {
      await axios.delete(`${BACKEND_URL}/api/cart/clear`)
      setCart({ items: [], userId: '', updatedAt: new Date() })
    } catch (error) {
      throw error.response?.data || error
    }
  }

  useEffect(() => {
    if (token) {
      fetchCart()
    }
  }, [token])

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
