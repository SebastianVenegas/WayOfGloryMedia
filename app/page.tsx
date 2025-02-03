'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isFromPWA = searchParams.get('source') === 'pwa'
    const isWayOfGloryMedia = window.location.hostname === 'wayofglorymedia.com'

    console.log('Navigation Status:', { 
      isFromPWA, 
      isWayOfGloryMedia, 
      hostname: window.location.hostname,
      source: searchParams.get('source')
    })

    if (isFromPWA && isWayOfGloryMedia) {
      // If launched from PWA, redirect to admin
      router.replace('/admin/products')
    } else {
      // If in browser, show the main site
      setIsLoading(false)
    }
  }, [router, searchParams])

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

