import React from 'react'
import { motion } from 'framer-motion'

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
      className="glass-panel p-4 rounded-lg"
    >
      <div className="w-full h-64 bg-dark-surface rounded mb-4"></div>
      <div className="h-6 bg-dark-surface rounded mb-3"></div>
      <div className="h-4 bg-dark-surface rounded w-24"></div>
    </motion.div>
  )
}

export function SkeletonText() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
      className="h-4 bg-dark-surface rounded"
    ></motion.div>
  )
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
