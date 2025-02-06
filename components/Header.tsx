'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(false)
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.getElementById('mobile-nav')
      if (nav && !nav.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header - Only Logo and Hamburger */}
        <div className="flex md:hidden items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
            WayofGlory
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
            WayofGlory
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
        {isOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-white/95 backdrop-blur-md border-t border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium 
                           text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-50"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  onClick={scrollToQuote}
                  className="w-full px-6 py-3 bg-[#0F172A] text-white rounded-xl font-medium 
                           hover:bg-[#1E293B] transition-all duration-200 text-center"
                >
                  Book a Consultation
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

