'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Digital', href: '/services/digital' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    closeMenu()
    const quoteSection = document.getElementById('quote')
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header - Only Logo and Hamburger */}
        <div className="flex md:hidden items-center justify-between h-24">
          <Link href="/" className="relative w-56 h-20" onClick={closeMenu}>
            <Image
              src="/logo/logo.png"
              alt="WayofGlory Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <button
            onClick={toggleMenu}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 
                     transition-all duration-300 hover:scale-105 active:scale-95"
            aria-expanded={isOpen}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-20">
          <Link href="/" className="relative w-72 h-16">
            <Image
              src="/logo/logo.png"
              alt="WayofGlory Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-[#1E3A8A] transition-colors duration-300"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={scrollToQuote}
              className="px-6 py-2.5 bg-[#0F172A] text-white rounded-xl font-medium 
                       hover:bg-[#1E293B] transform hover:-translate-y-0.5 
                       transition-all duration-200"
            >
              Book a Consultation
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div 
          className={`md:hidden fixed inset-x-0 top-24 bottom-0 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ 
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)'
          }}
        >
          <nav className="h-full px-6 py-8 overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Navigation Links */}
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMenu}
                    className="block px-4 py-4 text-lg font-medium text-gray-900 rounded-xl
                             hover:bg-gray-100 transition-all duration-200 transform hover:translate-x-1"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Bottom Section with CTA */}
              <div className="mt-auto pt-8 border-t border-gray-100">
                <div className="space-y-6">
                  <button
                    onClick={scrollToQuote}
                    className="w-full px-6 py-4 bg-[#0F172A] text-white rounded-xl font-medium 
                             hover:bg-[#1E293B] transform hover:scale-[1.02] 
                             transition-all duration-200 text-lg shadow-lg"
                  >
                    Book a Consultation
                  </button>
                  
                  {/* Contact Info */}
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Need immediate assistance?</p>
                    <a 
                      href="tel:+19514486409" 
                      className="text-[#1E3A8A] font-medium hover:underline"
                    >
                      (951) 448-6409
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

