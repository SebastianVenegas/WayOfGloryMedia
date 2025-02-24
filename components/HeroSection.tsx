'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, ArrowRight, Star } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const backgroundImages = [
  {
    url: 'https://images.unsplash.com/photo-1522327646852-4e28586a40dd?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Modern church worship service'
  },
  {
    url: 'https://images.unsplash.com/photo-1568732626545-b9208b767347?q=80&w=3528&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Professional audio mixing console'
  },
  {
    url: 'https://images.unsplash.com/photo-1613031729579-ace1feefda4c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Church sound system setup'
  },
  {
    url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=3538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Website development'
  }
]

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0)
  
  const titles = ["Websites", "Apps", "Sound", "Video"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [titles.length])

  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-[90vh] flex items-center pt-12 sm:pt-16 pb-16 sm:pb-24">
      {/* Background Images with Overlay */}
      {backgroundImages.map((image, index) => (
        <div
          key={image.url}
          className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover object-center brightness-[0.3] scale-105"
            priority={index === 0}
          />
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 via-brand-blue/70 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.7),transparent_70%)]"></div>
        </div>
      ))}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl">
          <div className="space-y-6 sm:space-y-8">
            {/* Animated Badge */}
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-white">
              <span className="flex items-center">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white mr-1.5 sm:mr-2" />
                <span className="line-clamp-1">Southern California's Trusted Church Technology Partner</span>
              </span>
            </div>

            {/* Heading with Enhanced Animation */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] font-bold text-white leading-[1.1] tracking-tight mb-4 sm:mb-8">
                Transform Your
                <br className="hidden sm:block" />
                <span className="sm:inline">Worship Experience</span>
                <br className="hidden sm:block" />
                <span className="block sm:-mt-8 sm:inline-block">with Crystal Clear{' '}
                <span className="relative inline-flex items-center min-h-[1.1em] min-w-[3em] translate-y-[0.20em]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={titles[currentTitleIndex]}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{
                        y: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="absolute whitespace-nowrap bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] text-transparent bg-clip-text font-extrabold drop-shadow-lg"
                    >
                      {titles[currentTitleIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
              </h1>
            </div>

            {/* Enhanced Subheading */}
            <p className="text-lg sm:text-xl text-gray-300 mt-4 sm:mt-6 mb-2 sm:mb-4">
              Let&apos;s elevate your church&apos;s audio experience
            </p>

            {/* CTA Buttons with Enhanced Styling */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button 
                onClick={scrollToQuote}
                className="group relative bg-white hover:bg-white/90 text-brand-blue px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold inline-flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
              >
                <MessageCircle className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Schedule Free Consultation</span>
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <Link 
                href="tel:+19514486409" 
                className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/10 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold inline-flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
              >
                <Phone className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap">(951) 448-6409</span>
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 opacity-0 transition-transform duration-200 group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Indicators */}
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-2 sm:space-y-3">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`transition-all duration-300 ${
              index === currentImageIndex 
                ? 'h-8 sm:h-12 bg-white' 
                : 'h-8 sm:h-12 bg-white/30 hover:bg-white/50'
            } w-1 sm:w-1.5 rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Enhanced Background Elements */}
      <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-t from-black/50 to-transparent"></div>
      <div className="absolute top-0 right-0 w-1/4 sm:w-1/3 h-full bg-gradient-to-l from-black/30 to-transparent"></div>
    </section>
  )
}

