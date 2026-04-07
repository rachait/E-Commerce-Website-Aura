import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { aiAPI } from '../utils/api'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 How can I help you with AURA today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call AI API for response
      const response = await aiAPI.chat({
        message: input,
        sessionId: 'chat-widget'
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.reply || 'I\'m here to help! Tell me more about what you\'re looking for.'
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback response
      const fallbackMessage = {
        role: 'assistant',
        content: 'I\'m experiencing some issues. Please try again or contact support.'
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat Widget Container */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="glass-panel w-96 h-96 rounded-lg flex flex-col border border-cyan-neon/30 overflow-hidden mb-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyan-neon/20 bg-dark-surface/50">
                <div>
                  <h3 className="font-heading font-bold text-cyan-neon">AURA Assistant</h3>
                  <p className="text-xs text-text-secondary">Always here to help</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-dark-bg rounded transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-cyan-neon/20 border border-cyan-neon/50 text-text-primary'
                          : 'glass-panel border-text-secondary/20'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-neon animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-neon animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-neon animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-cyan-neon/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something..."
                    className="flex-1 glass-panel p-2 rounded text-sm placeholder-text-secondary focus:outline-none focus:border-cyan-neon"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2 glass-panel hover:border-cyan-neon rounded transition disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="glass-panel p-4 rounded-full hover:border-cyan-neon transition border border-text-secondary/30"
        >
          {isOpen ? (
            <X size={24} className="text-text-primary" />
          ) : (
            <MessageCircle size={24} className="text-cyan-neon" />
          )}
        </motion.button>
      </div>
    </>
  )
}
