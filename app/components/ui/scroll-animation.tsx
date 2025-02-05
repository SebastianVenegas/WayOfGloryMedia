import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export interface ScrollAnimationProps {
  children: ReactNode
  type?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right'
  delay?: number
  className?: string
  id?: string
}

const animations = {
  'fade-up': {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-down': {
    initial: { opacity: 0, y: -20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-left': {
    initial: { opacity: 0, x: -20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  'fade-right': {
    initial: { opacity: 0, x: 20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export default function ScrollAnimation({ 
  children, 
  type = 'fade-up',
  delay = 0,
  className,
  id
}: ScrollAnimationProps) {
  const animation = animations[type]
  
  return (
    <motion.div
      {...animation}
      transition={{ ...animation.transition, delay }}
      className={className}
      id={id}
    >
      {children}
    </motion.div>
  )
} 