import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('auth-token'))
  const [loading, setLoading] = useState(false)

  // Setup axios default header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // ============ OTP METHODS ============
  
  const sendOTP = async (email, name = 'User') => {
    try {
      setLoading(true)
      const response = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, {
        email,
        name
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (email, otp, isSignup = false, password = null, name = null) => {
    try {
      setLoading(true)
      const response = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
        email,
        otp,
        isSignup,
        password,
        name
      })
      
      if (response.data.success && response.data.access_token) {
        setUser(response.data.user)
        setToken(response.data.access_token)
        localStorage.setItem('auth-token', response.data.access_token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    } finally {
      setLoading(false)
    }
  }

  // ============ TRADITIONAL AUTH METHODS (Legacy) ============

  const register = async (email, password, name) => {
    try {
      setLoading(true)
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        email,
        password,
        name
      })
      setUser(response.data.user)
      setToken(response.data.access_token)
      localStorage.setItem('auth-token', response.data.access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      return response.data
    } catch (error) {
      throw error.response?.data || error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password
      })
      setUser(response.data.user)
      setToken(response.data.access_token)
      localStorage.setItem('auth-token', response.data.access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      return response.data
    } catch (error) {
      throw error.response?.data || error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth-token')
    delete axios.defaults.headers.common['Authorization']
  }

  const fetchCurrentUser = async () => {
    if (token) {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`)
        setUser(response.data)
      } catch (error) {
        logout()
      }
    }
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [token])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        register, 
        login, 
        logout,
        sendOTP,
        verifyOTP,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
