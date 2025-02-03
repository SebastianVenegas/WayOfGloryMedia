'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import AboutUs from '../components/AboutUs'
import ServicesOverview from '../components/ServicesOverview'
import ChurchShowcase from '../components/ChurchShowcase'
import QuoteSection from '../components/QuoteSection'
import CallToAction from '../components/CallToAction'
import Footer from '../components/Footer'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectPWA = () => {
      if (typeof window === 'undefined') return false

      // iOS detection
      if (window.navigator && 'standalone' in window.navigator) {
        // @ts-ignore - iOS specific
        return window.navigator.standalone === true
      }

      // Modern PWA detection
      if (window.matchMedia('(display-mode: standalone)').matches) return true
      if (window.matchMedia('(display-mode: fullscreen)').matches) return true
      if (window.matchMedia('(display-mode: minimal-ui)').matches) return true

      // Check if installed
      if ('BeforeInstallPromptEvent' in window) {
        // @ts-ignore
        return window.BeforeInstallPromptEvent === null
      }

      return false
    }

    const isPWA = detectPWA()
    const isWayOfGloryMedia = window.location.hostname === 'wayofglorymedia.com'

    console.log('PWA Detection:', {
      isPWA,
      isWayOfGloryMedia,
      hostname: window.location.hostname,
      userAgent: window.navigator.userAgent,
      standalone: 'standalone' in window.navigator,
      displayMode: {
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
        minimalUi: window.matchMedia('(display-mode: minimal-ui)').matches
      }
    })

    if (isPWA && isWayOfGloryMedia) {
      router.replace('/admin/products')
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <AboutUs />
      <ServicesOverview />
      <ChurchShowcase />
      <QuoteSection />
      <CallToAction />
      <Footer />
    </main>
  )
}

