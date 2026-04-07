import React, { useRef, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export default function OTPInput({ 
  otpCode, 
  setOtpCode, 
  onResend, 
  isResending = false,
  timeUntilResend = 0 
}) {
  const inputRefs = useRef([])

  const handleChange = (e, index) => {
    const value = e.target.value
    
    // Only allow digits
    if (!/^\d*$/.test(value)) return
    
    // Update OTP code
    const newOtp = otpCode.split('')
    newOtp[index] = value

    setOtpCode(newOtp.join(''))

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text')
    if (!/^\d{6}$/.test(pastedText)) return
    
    e.preventDefault()
    setOtpCode(pastedText)
    
    // Focus last input after paste
    inputRefs.current[5]?.focus()
  }

  return (
    <div className="space-y-6">
      {/* OTP Input Boxes */}
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength="1"
            value={otpCode[index] || ''}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            placeholder="•"
            className="w-12 h-14 bg-black text-white text-center text-xl font-mono border-2 border-gray-600 rounded-lg placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />
        ))}
      </div>

      {/* Resend Button */}
      <div className="flex justify-center">
        <button
          onClick={onResend}
          disabled={isResending || timeUntilResend > 0}
          className="flex items-center gap-2 text-cyan-500 hover:text-cyan-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={16} />
          {timeUntilResend > 0 ? (
            <span className="text-sm">Resend in {timeUntilResend}s</span>
          ) : (
            <span className="text-sm">Resend OTP</span>
          )}
        </button>
      </div>

      {/* Helpful Text */}
      <p className="text-center text-sm text-gray-500">
        Check your email for the 6-digit verification code. It will expire in 10 minutes.
      </p>
    </div>
  )
}