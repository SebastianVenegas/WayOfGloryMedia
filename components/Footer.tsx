import Link from 'next/link'
import { Facebook, Youtube, Instagram } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const quickLinks = [
  { name: 'Services', href: '/services' },
  { name: 'Digital', href: '/services/digital' },
  { name: 'Video', href: '/services/video' },
  { name: 'Products', href: '/products' },
]

const services = [
  { name: 'Digital Services', href: '/services/digital' },
  { name: 'Video Services', href: '/services/video' },
  { name: 'Sound System Optimization', href: '/services#sound-optimization' },
  { name: 'Live Streaming Setup', href: '/services#live-streaming' },
  { name: 'Equipment Consultation', href: '/services#equipment-consultation' },
  { name: 'Staff Training', href: '/services#staff-training' }
]

export default function Footer() {
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <footer className="bg-[#0F172A] text-gray-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Social Links */}
          <div>
            <Link href="/" onClick={() => handleNavigation('/')}>
              <Image
                src="/images/logo/logo.png"
                alt="Way of Glory Media, Inc."
                width={200}
                height={50}
                className=""
              />
            </Link>
            <div className="flex gap-4 mt-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/wayofglorymedia" target="_blank" rel="noopener noreferrer"
                 className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#40B5E5] font-semibold mb-6">QUICK LINKS</h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[#40B5E5] font-semibold mb-6">OUR SERVICES</h3>
            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service.name}>
                  <button
                    onClick={() => handleNavigation(service.href)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {service.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[#40B5E5] font-semibold mb-6">CONTACT US</h3>
            <ul className="space-y-4">
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

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-center text-sm">
            © {new Date().getFullYear()} WayofGlory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

