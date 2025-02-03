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
    // Check if we're in PWA mode and on the correct domain
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    const isCorrectDomain = window.location.hostname === 'santi-sounds.vercel.app'

    if (isPWA && isCorrectDomain) {
      // If in PWA mode and on correct domain, redirect to admin
      router.replace('/admin/products')
    } else {
      // If in browser or on wayofglorymedia.com, show the main site
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

