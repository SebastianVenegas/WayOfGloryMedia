import Link from 'next/link'
import { Facebook, Youtube, Instagram, Music2 } from 'lucide-react'

const quickLinks = [
  { name: 'Services', href: '/services' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' }
]

const services = [
  { name: 'Sound System Optimization', href: '/services/sound-system' },
  { name: 'Live Streaming Setup', href: '/services/live-streaming' },
  { name: 'Equipment Consultation', href: '/services/consultation' },
  { name: 'Staff Training', href: '/services/training' }
]

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/santisounds' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/santisounds' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/santisounds' }
]

export default function Footer() {
  return (
    <footer className="bg-[#010B1D] text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Main Footer Content */}
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
          {/* Company Info */}
          <div className="relative">
            <div className="flex items-center space-x-3 mb-8">
              <Music2 className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Santi Sounds
              </h2>
            </div>
            <div className="flex items-center space-x-6 relative">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-blue-400 transform hover:scale-110 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5" />
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-16 md:gap-24">
            {/* Quick Links */}
            <div className="relative">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-6 text-blue-400">Quick Links</h3>
              <ul className="space-y-4">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-blue-400 mr-0 group-hover:mr-2 transition-all duration-300" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="relative">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-6 text-blue-400">Our Services</h3>
              <ul className="space-y-4">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link 
                      href={service.href}
                      className="text-sm text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-blue-400 mr-0 group-hover:mr-2 transition-all duration-300" />
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2023 Santi Sounds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

