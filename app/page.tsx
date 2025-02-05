'use client'

import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import AboutUs from '../components/AboutUs'
import ServicesOverview from '../components/ServicesOverview'
import ChurchShowcase from '../components/ChurchShowcase'
import QuoteSection from '../components/QuoteSection'
import CallToAction from '../components/CallToAction'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <AboutUs />
      <ServicesOverview />
      <ChurchShowcase />
      <div id="quote">
        <QuoteSection />
      </div>
      <CallToAction />
      <Footer />
    </main>
  )
}

