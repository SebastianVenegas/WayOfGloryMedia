'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    // Check if we're in PWA mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches

    if (isPWA) {
      // If in PWA mode, redirect to admin
      router.replace('/admin/products')
    } else {
      // If in browser, redirect to main site
      window.location.href = 'https://wayofglorymedia.com'
    }
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
}

