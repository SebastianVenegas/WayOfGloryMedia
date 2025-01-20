'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface ScrollAnimationProps {
  children: React.ReactNode
  className?: string
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom' | 'flip'
  duration?: number
  delay?: number
}

const animations = {
  'fade-up': {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 }
  },
  'fade-down': {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 }
  },
  'fade-left': {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 }
  },
  'fade-right': {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 }
  },
  'zoom': {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 }
  },
  'flip': {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 }
  }
}

export default function ScrollAnimation({ 
  children, 
  className = '', 
  animation = 'fade-up',
  duration = 0.5,
  delay = 0
}: ScrollAnimationProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={animations[animation].initial}
      animate={isInView ? animations[animation].animate : animations[animation].initial}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 