import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OTPInput from '../components/OTPInput'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [useOTP, setUseOTP] = useState(false)
  const [otpStep, setOtpStep] = useState('email') // 'email', 'otp', 'password' (for signup)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [timeUntilResend, setTimeUntilResend] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [otpCode, setOtpCode] = useState('')
  const { login, sendOTP, verifyOTP } = useAuth()
  const navigate = useNavigate()

  // Resend timer
  useEffect(() => {
    let interval
    if (timeUntilResend > 0) {
      interval = setInterval(() => {
        setTimeUntilResend((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timeUntilResend])

  // Resend timer
  useEffect(() => {
    let interval
    if (timeUntilResend > 0) {
      interval = setInterval(() => {
        setTimeUntilResend((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timeUntilResend])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // ============ OTP FLOW ============

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (!formData.email) {
        setError('Please enter your email')
        return
      }

      if (!isLogin && !formData.name.trim()) {
        setError('Please enter your name')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        return
      }

      const response = await sendOTP(formData.email, isLogin ? 'User' : formData.name)
      if (response.success) {
        setSuccessMessage(response.message || 'OTP sent to your email!')
        setOtpStep('otp')
        setTimeUntilResend(60)
      }
    } catch (err) {
      setError(err.detail || err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setOtpError('')
    setError('')
    setLoading(true)

    try {
      if (otpCode.length !== 6) {
        setOtpError('Please enter a 6-digit OTP')
        return
      }

      if (!isLogin && !formData.password) {
        setOtpStep('password')
        setLoading(false)
        return
      }

      const response = await verifyOTP(
        formData.email,
        otpCode,
        !isLogin, // isSignup
        !isLogin ? formData.password : null,
        !isLogin ? formData.name : null
      )

      if (response.success) {
        setSuccessMessage('Authentication successful!')
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (err) {
      const message = err.detail || err.message || 'Invalid or expired OTP'
      if (typeof message === 'string' && message.toLowerCase().includes('user not found')) {
        setIsLogin(false)
        setOtpStep('password')
        setSuccessMessage('No account found for this email. Set a password to create your account.')
        setOtpError('')
      } else {
        setOtpError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setOtpError('')
    setLoading(true)

    try {
      const response = await sendOTP(formData.email, isLogin ? 'User' : formData.name)
      if (response.success) {
        setOtpCode('')
        setSuccessMessage(response.message || 'New OTP sent to your email!')
        setTimeUntilResend(60)
      }
    } catch (err) {
      setOtpError(err.detail || err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  // ============ TRADITIONAL AUTH FLOW ============

  const handleTraditionalSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          setError('Please fill in all fields')
          return
        }
        await login(formData.email, formData.password)
      } else {
        // Account creation is OTP-only.
        setUseOTP(true)
        setOtpStep('email')
        setSuccessMessage('For account creation, please verify your email with OTP.')
        setLoading(false)
        return
      }
      navigate('/')
    } catch (err) {
      setError(err.detail || err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUseOTP(false)
    setOtpStep('email')
    setFormData({ email: '', password: '', name: '' })
    setOtpCode('')
    setError('')
    setOtpError('')
    setSuccessMessage('')
    setTimeUntilResend(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4 bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-panel p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold neon-text mb-2">AURA</h1>
            <h2 className="font-heading text-xl text-text-secondary">
              {useOTP ? (
                otpStep === 'otp' ? 'Verify Code' : 'Set Password'
              ) : (
                isLogin ? 'Welcome Back' : 'Join Us'
              )}
            </h2>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-green-400" />
              <p className="text-green-200 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error */}
          {(error || otpError) && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error || otpError}</p>
            </div>
          )}

          {/* ============ OTP FLOW ============ */}
          {useOTP ? (
            <>
              {/* Email Step */}
              {otpStep === 'email' && (
                <motion.form
                  onSubmit={handleSendOTP}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-body text-text-secondary mb-2">
                        Name
                      </label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-3 text-text-secondary" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-body text-text-secondary mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-text-secondary" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-3 glass-button rounded-lg font-heading font-600 text-text-primary hover:border-cyan-neon hover:bg-cyan-neon/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </motion.form>
              )}

              {/* OTP Verification Step */}
              {otpStep === 'otp' && (
                <motion.form
                  onSubmit={handleVerifyOTP}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <OTPInput
                    otpCode={otpCode}
                    setOtpCode={setOtpCode}
                    onResend={handleResendOTP}
                    isResending={loading}
                    timeUntilResend={timeUntilResend}
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full mt-8 py-3 glass-button rounded-lg font-heading font-600 text-text-primary hover:border-cyan-neon hover:bg-cyan-neon/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setOtpStep('email')}
                    className="w-full mt-3 py-2 text-cyan-neon hover:underline text-sm font-body"
                  >
                    Use Different Email
                  </button>
                </motion.form>
              )}

              {/* Password Step (Signup Only) */}
              {!isLogin && otpStep === 'password' && (
                <motion.form
                  onSubmit={handleVerifyOTP}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div>
                    <label className="block text-sm font-body text-text-secondary mb-2">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-text-secondary" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Minimum 8 characters recommended
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formData.password}
                    className="w-full mt-6 py-3 glass-button rounded-lg font-heading font-600 text-text-primary hover:border-cyan-neon hover:bg-cyan-neon/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </motion.form>
              )}

              {/* Switch Auth Method */}
              <div className="mt-8 pt-6 border-t border-cyan-neon/20">
                <button
                  onClick={resetForm}
                  className="text-center text-text-secondary text-sm hover:text-cyan-neon"
                >
                  Back to {isLogin ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </>
          ) : (
            // ============ TRADITIONAL AUTH FLOW ============
            <>
              <form onSubmit={handleTraditionalSubmit} className="space-y-4">
                {/* Name Field (Register Only) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-body text-text-secondary mb-2">
                      Name
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-3 text-text-secondary" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-body text-text-secondary mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3 text-text-secondary" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-body text-text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3 text-text-secondary" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 glass-panel rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 glass-button rounded-lg font-heading font-600 text-text-primary hover:border-cyan-neon hover:bg-cyan-neon/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>

                {/* OTP Option */}
                <div className="mt-4 pt-4 border-t border-cyan-neon/20">
                  <button
                    type="button"
                    onClick={() => {
                      setUseOTP(true)
                      setError('')
                      setFormData({ email: formData.email, password: '', name: formData.name })
                    }}
                    className="w-full py-2 text-sm text-cyan-neon hover:underline font-body"
                  >
                    Use OTP Instead
                  </button>
                </div>
              </form>

              {/* Toggle Button */}
              <div className="mt-8 pt-6 border-t border-cyan-neon/20">
                <p className="text-center text-text-secondary text-sm">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      const nextIsLogin = !isLogin
                      setIsLogin(nextIsLogin)
                      setUseOTP(!nextIsLogin)
                      setOtpStep('email')
                      setError('')
                      setSuccessMessage('')
                      setFormData({ email: '', password: '', name: '' })
                    }}
                    className="text-cyan-neon hover:underline font-semibold"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {/* Demo Credentials */}
              <div className="mt-8 p-4 bg-cyan-neon/5 border border-cyan-neon/30 rounded-lg">
                <p className="font-heading font-semibold text-sm mb-2">Demo Credentials</p>
                <div className="text-xs text-text-secondary space-y-1">
                  <p>
                    <span className="text-cyan-neon">Admin:</span> admin@aura.com / admin123
                  </p>
                  <p>
                    <span className="text-cyan-neon">User:</span> user@example.com / password123
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
