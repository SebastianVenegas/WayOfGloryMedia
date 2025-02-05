'use client'

import { useState } from 'react'
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
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-[#1E3A8A]">
              WayofGlory
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
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
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                       hover:text-gray-500 hover:bg-gray-100 focus:outline-none 
                       focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                        <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium 
                           text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-50"
                        >
                  {item.name}
                        </Link>

                      ))}
              <button
                onClick={scrollToQuote}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium 
                         text-gray-600 hover:text-[#1E3A8A] hover:bg-gray-50"
              >
                Book a Consultation
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

