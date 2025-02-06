'use client'

import { type ReactElement } from 'react'
import Header from '../../../components/Header'
import Footer from '@/components/Footer'
import { Video, Camera, Users, Clapperboard, Settings, MessageCircle, Star, ArrowRight, MonitorPlay, Film, Play, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import ScrollAnimation from '../../../components/ui/scroll-animation'
import { useState, useEffect } from 'react'
import QuoteSection from '../../../components/QuoteSection'
import { motion } from 'framer-motion'

const services = [
  {
    id: "201",
    title: "Event Coverage",
    subtitle: "Comprehensive Event Services",
    description: "Professional coverage for all your church events, from regular services to special occasions.",
    icon: Video,
    image: "/images/about/broadcasting.jpg",
    features: [
      "Church Services: Weekly worship and special services",
      "Weddings: Professional wedding videography",
      "Conferences: Multi-camera event coverage",
      "Concerts: High-quality audio and video recording",
      "Seminars: Detailed content capture",
      "Special Announcements: Professional promotional content"
    ],
    benefits: [
      "Professional quality",
      "Multiple camera angles",
      "High-quality audio",
      "Quick turnaround"
    ]
  },
  {
    id: "202",
    title: "Custom Video Productions",
    subtitle: "Professional Content Creation",
    description: "From sermon recordings to promotional content, we create high-quality video productions tailored to your ministry's needs.",
    icon: Film,
    image: "https://images.unsplash.com/photo-1584224549374-995cbac1ab62?q=80&w=2792&auto=format&fit=crop",
    features: [
      "Sermon recordings and series",
      "Testimonial videos",
      "Ministry promotional content",
      "Educational and training videos",
      "Custom content creation",
      "Professional editing and post-production"
    ],
    benefits: [
      "Engaging content",
      "Professional quality",
      "Custom solutions",
      "Expert guidance"
    ]
  },
  {
    id: "203",
    title: "Equipment & Expertise",
    subtitle: "Technical Excellence",
    description: "State-of-the-art technology and years of experience in live streaming and media production, including installation and management.",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1471999796791-874f5de3b3f4?q=80&w=2880&auto=format&fit=crop",
    features: [
      "Professional cameras and video switchers",
      "High-quality microphones and audio mixers",
      "Lighting equipment for optimal video quality",
      "Streaming encoders and software",
      "On-site technical support",
      "Complete system installation"
    ],
    benefits: [
      "Latest technology",
      "Expert support",
      "Complete solutions",
      "Reliable performance"
    ]
  }
]

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=3270&auto=format&fit=crop",
    alt: "Professional cinema camera setup"
  },
  {
    src: "https://images.unsplash.com/photo-1540655037529-dec987208707?q=80&w=3270&auto=format&fit=crop",
    alt: "Video production control room"
  },
  {
    src: "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=3270&auto=format&fit=crop",
    alt: "Professional camera equipment"
  }
]

const highlights = [
  {
    icon: Video,
    title: "All Events Covered",
    description: "From services to special events"
  },
  {
    icon: MonitorPlay,
    title: "Professional Equipment",
    description: "State-of-the-art technology"
  }
]

export default function VideoServicesPage(): ReactElement {
  const [activeTab, setActiveTab] = useState('live')

  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 md:pt-32 flex items-center overflow-hidden">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1637250096679-c10f2751def8?q=80&w=3540&auto=format&fit=crop"
            alt="Professional video production camera setup"
            fill
            className="object-cover brightness-[0.8] scale-x-[-1]"
            priority
          />
          {/* Dark to bright gradient mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/40 to-transparent" />
          {/* Additional brightness on the right */}
          <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-[#40B5E5]/20 bg-[#40B5E5]/10 
                       backdrop-blur-md px-4 py-2 text-sm text-white mb-8"
            >
              <Star className="w-4 h-4 text-[#40B5E5] mr-2" />
              <span>Professional Video Production & Live Streaming</span>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Transform Your Church's
                <span className="text-[#40B5E5]"> Digital Presence</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-12">
                From sermon recordings to promotional content, our team creates high-quality video productions 
                tailored to your ministry's needs. We work closely with pastors and church leaders to ensure 
                your message is conveyed effectively and engagingly.
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12 sm:mb-16"
            >
              <button 
                onClick={() => document.getElementById('quote-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 bg-[#40B5E5] text-white rounded-xl 
                         font-medium hover:bg-[#7DD3F7] transition-all duration-300 
                         transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-base sm:text-lg"
              >
                Ready to Amplify Your Ministry's Reach?
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>

            {/* Service Highlights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-16"
            >
              {highlights.map((highlight, index) => (
                <div 
                  key={highlight.title}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 
                           hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-2 sm:p-3 bg-[#40B5E5]/20 rounded-xl">
                      <highlight.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#40B5E5]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{highlight.title}</h3>
                      <p className="text-white/80 text-xs sm:text-sm">{highlight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Types */}
          <div className="mb-16">
            <ScrollAnimation type="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8">
                We Cover All Your Events
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Church Services
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Weddings
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Conferences
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Concerts
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Seminars
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="px-6 py-3 bg-[#40B5E5]/10 text-[#40B5E5] rounded-full font-medium hover:bg-[#40B5E5]/20 transition-colors"
                >
                  Special Announcements
                </motion.div>
              </div>
            </ScrollAnimation>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ScrollAnimation
                key={service.id}
                type="fade-up"
                delay={index * 0.1}
              >
                <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#40B5E5]/50 
                              transition-all shadow-lg hover:shadow-xl">
                  {/* Service Image */}
                  <div className="relative h-64">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    
                    {/* Service Icon */}
                    <div className="absolute top-4 right-4">
                      <div className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                        <service.icon className="w-6 h-6 text-[#40B5E5]" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                    <p className="text-gray-600 mb-8">{service.description}</p>

                    {/* Features Preview */}
                    <div className="space-y-4 mb-8">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#40B5E5]" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => document.getElementById('quote-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full py-4 bg-gray-50 hover:bg-[#40B5E5]/5 border border-gray-200 
                               hover:border-[#40B5E5] rounded-xl text-gray-700 hover:text-[#40B5E5] 
                               transition-all group/btn"
                    >
                      <span className="flex items-center justify-center">
                        Learn More
                        <ChevronRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <div id="quote-section">
        <QuoteSection />
      </div>

      <Footer />
    </main>
  )
} 