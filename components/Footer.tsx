import Link from 'next/link'
import { Facebook, Youtube, Instagram, Music } from 'lucide-react'

const quickLinks = [
  { name: 'Services', href: '/services' },
  { name: 'Digital', href: '/services/digital' },
  { name: 'Products', href: '/products' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

const services = [
  { name: 'Digital Services', href: '/services/digital' },
  { name: 'Sound System Optimization', href: '/services#sound-optimization' },
  { name: 'Live Streaming Setup', href: '/services#live-streaming' },
  { name: 'Equipment Consultation', href: '/services#equipment-consultation' },
  { name: 'Staff Training', href: '/services#staff-training' }
]

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-center space-x-2">
              <Music className="w-8 h-8" />
              <span className="text-xl font-bold">WayofGlory</span>
            </Link>
            <div className="mt-6 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/wayofglorymedia" target="_blank" rel="noopener noreferrer"
                 className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-blue-400 font-semibold mb-4">QUICK LINKS</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} 
                        className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-blue-400 font-semibold mb-4">OUR SERVICES</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <Link href={service.href}
                        className="text-gray-400 hover:text-white transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-blue-400 font-semibold mb-4">CONTACT US</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="tel:+19514486409" className="hover:text-white transition-colors">
                  (951) 448-6409
                </a>
              </li>
              <li>
                <a href="mailto:info@wayofglory.com" className="hover:text-white transition-colors">
                  info@wayofglory.com
                </a>
              </li>
              <li>Southern California</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} WayofGlory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

