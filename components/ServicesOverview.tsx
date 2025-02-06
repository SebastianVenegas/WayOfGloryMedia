'use client'

import Image from 'next/image'
import { Headphones, Video, Settings, ChevronRight, Speaker, Globe, Smartphone, ArrowRight } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

const services = [
  {
    title: "Website Development",
    description: "Create a stunning online presence with our professional church website development.",
    icon: Globe,
    features: [
      "Custom website design",
      "Mobile-responsive layouts",
      "Content management system",
      "Online giving integration"
    ],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    href: "/services/digital#website-development"
  },
  {
    title: "Mobile App Development",
    description: "Connect with your congregation through custom mobile apps.",
    icon: Smartphone,
    features: [
      "iOS and Android apps",
      "Push notifications",
      "Event calendars",
      "Prayer requests"
    ],
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2340&auto=format&fit=crop",
    href: "/services/digital#app-development"
  },
  {
    title: "Audio System Design",
    description: "Get crystal-clear sound with our professional audio system design.",
    icon: Headphones,
    features: [
      "Custom system design",
      "Professional installation",
      "Sound optimization",
      "Ongoing maintenance"
    ],
    image: "/images/services/audio-system.jpg",
    href: "/services#audio-system-design"
  },
  {
    title: "Live Streaming",
    description: "Reach your congregation anywhere with high-quality live streaming.",
    icon: Video,
    features: [
      "HD video streaming",
      "Multi-platform broadcasting",
      "Professional recording",
      "Easy-to-use systems"
    ],
    image: "/images/services/streaming.jpg",
    href: "/services#live-streaming"
  },
  {
    title: "Sound Optimization",
    description: "Maximize your sound system's potential with professional tuning.",
    icon: Settings,
    features: [
      "Acoustic analysis",
      "System calibration",
      "Equipment testing",
      "Sound balancing"
    ],
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2370&auto=format&fit=crop",
    href: "/services#sound-optimization"
  }
]

export default function ServicesOverview() {
  const router = useRouter()

  const scrollToQuote = () => {
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2.5 bg-[#40B5E5]/10 rounded-xl">
                <Speaker className="w-6 h-6 text-[#40B5E5]" />
              </div>
              <span className="text-[#40B5E5] font-semibold">Our Services</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Technology Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elevate your church's presence with our comprehensive digital and audio solutions.
            </p>
          </div>
        </ScrollAnimation>

        {/* Services Grid - Special layout for 5 items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* First Row - 3 items */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service, index) => (
              <ScrollAnimation 
                key={service.title}
                type="fade-up"
                delay={0.1 * index}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl 
                            transition-all duration-300 h-full border border-gray-100"
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gray-900/60 group-hover:bg-gray-900/50 transition-colors duration-300" />
                    
                    {/* Icon Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2">
                          <div className="w-1 h-1 rounded-full bg-[#40B5E5]" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn More Link */}
                    <Link 
                      href={service.href}
                      className="inline-flex items-center text-[#40B5E5] font-medium hover:text-[#7DD3F7] 
                               transition-colors group/link"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>

          {/* Second Row - 2 items */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 md:max-w-3xl lg:mx-auto">
            {services.slice(3).map((service, index) => (
              <ScrollAnimation 
                key={service.title}
                type="fade-up"
                delay={0.1 * (index + 3)}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl 
                            transition-all duration-300 h-full border border-gray-100"
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gray-900/60 group-hover:bg-gray-900/50 transition-colors duration-300" />
                    
                    {/* Icon Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2">
                          <div className="w-1 h-1 rounded-full bg-[#40B5E5]" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn More Link */}
                    <Link 
                      href={service.href}
                      className="inline-flex items-center text-[#40B5E5] font-medium hover:text-[#7DD3F7] 
                               transition-colors group/link"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <ScrollAnimation type="fade-up" delay={0.3}>
          <div className="mt-16 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToQuote}
              className="inline-flex items-center px-8 py-4 bg-[#40B5E5] text-white rounded-xl 
                       font-medium shadow-lg shadow-[#40B5E5]/20 hover:bg-[#7DD3F7] 
                       transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}

