'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Digital', href: '/services/digital' },
  { name: 'Video', href: '/services/video' },
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
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0F172A] border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header - Only Logo and Hamburger */}
          <div className="flex md:hidden items-center justify-between h-24">
            <Link href="/" className="relative w-56 h-20" onClick={closeMenu}>
              <Image
                src="/images/logo/logo.png"
                alt="WayofGlory Logo"
                fill
                className="object-contain"
                priority
              />
            </Link>
            <button
              onClick={toggleMenu}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 
                       transition-all duration-300 hover:scale-105 active:scale-95"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-20">
            <Link href="/" className="relative w-56 h-20">
              <Image
                src="/images/logo/logo.png"
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
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={scrollToQuote}
                className="px-6 py-2.5 bg-[#40B5E5] text-white rounded-xl font-medium 
                         hover:bg-[#7DD3F7] transform hover:-translate-y-0.5 
                         transition-all duration-200"
              >
                Book a Consultation
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-[#0F172A] shadow-2xl z-50 
                   transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link href="/" onClick={closeMenu} className="relative w-48 h-12">
            <Image
              src="/images/logo/logo.png"
              alt="WayofGlory Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <button
            onClick={closeMenu}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <nav className="h-full overflow-y-auto">
          <div className="px-6 py-8">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMenu}
                  className="block px-4 py-4 text-lg font-medium text-gray-300 rounded-xl
                           hover:bg-white/10 hover:text-white transition-all duration-200 transform hover:translate-x-1"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Bottom Section with CTA */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <div className="space-y-6">
                <button
                  onClick={scrollToQuote}
                  className="w-full px-6 py-4 bg-[#40B5E5] text-white rounded-xl font-medium 
                           hover:bg-[#7DD3F7] transform hover:scale-[1.02] 
                           transition-all duration-200 text-lg shadow-lg"
                >
                  Book a Consultation
                </button>
                
                {/* Contact Info */}
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Need immediate assistance?</p>
                  <a 
                    href="tel:+19514486409" 
                    className="text-[#40B5E5] font-medium hover:text-[#7DD3F7]"
                  >
                    (951) 448-6409
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

