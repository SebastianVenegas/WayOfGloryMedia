'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollAnimationProps {
  children: ReactNode
  type?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right'
  delay?: number
}

const animations = {
  'fade-up': {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-down': {
    initial: { opacity: 0, y: -50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-left': {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-right': {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export default function ScrollAnimation({ children, type = 'fade-up', delay = 0 }: ScrollAnimationProps) {
  const animation = animations[type]
  return (
    <motion.div
      initial={animation.initial}
      whileInView={animation.whileInView}
      viewport={animation.viewport}
      transition={{ ...animation.transition, delay }}
    >
      {children}
    </motion.div>
  )
} 