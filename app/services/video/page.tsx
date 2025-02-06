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
    title: "Live Service Broadcasting",
    subtitle: "Professional Live Streaming",
    description: "Expand your church's reach with professional live broadcasting. Our team ensures high-quality, reliable streaming for every service.",
    icon: Video,
    image: "/images/about/broadcasting.jpg",
    features: [
      "Multi-Camera Live Production: Dynamic views and professional transitions",
      "Platform Integration: Stream to Facebook, YouTube, and your website",
      "Real-Time Quality Monitoring: Ensure consistent streaming quality",
      "Professional Graphics: Lower thirds, announcements, and song lyrics",
      "Audio Integration: Synchronized high-quality audio feed",
      "Recording & Archive: Save broadcasts for future use"
    ],
    benefits: [
      "Wider ministry reach",
      "Professional broadcast quality",
      "Reliable streaming",
      "Enhanced viewer experience"
    ]
  },
  {
    id: "202",
    title: "Video Production",
    subtitle: "Cinematic Content Creation",
    description: "Create compelling video content for your church. From promotional videos to sermon series, we deliver cinematic quality that engages your audience.",
    icon: Film,
    image: "https://images.unsplash.com/photo-1584224549374-995cbac1ab62?q=80&w=2792&auto=format&fit=crop",
    features: [
      "Professional Filming: High-end cameras and equipment",
      "Creative Direction: Storytelling and concept development",
      "Post-Production: Expert editing and color grading",
      "Motion Graphics: Custom animations and effects",
      "Sound Design: Professional audio mixing",
      "Content Strategy: Maximize impact and engagement"
    ],
    benefits: [
      "Cinematic quality",
      "Engaging storytelling",
      "Professional polish",
      "Memorable content"
    ]
  },
  {
    id: "203",
    title: "Equipment Setup",
    subtitle: "Technical Infrastructure",
    description: "Get the right equipment and setup for your video needs. We design and implement complete video systems tailored to your church.",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1471999796791-874f5de3b3f4?q=80&w=2880&auto=format&fit=crop",
    features: [
      "System Design: Custom video production setup",
      "Camera Selection: Professional camera systems",
      "Switching Equipment: Multi-camera production capability",
      "Streaming Hardware: Reliable broadcast equipment",
      "Control Room Setup: Professional monitoring station",
      "Infrastructure Planning: Cables, mounts, and accessories"
    ],
    benefits: [
      "Professional setup",
      "Future-proof system",
      "Reliable performance",
      "Easy operation"
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
    title: "Professional Video",
    description: "Cinematic quality production"
  },
  {
    icon: MonitorPlay,
    title: "Live Streaming",
    description: "Reliable broadcast solutions"
  }
]

export default function VideoServicesPage(): ReactElement {
  const [activeTab, setActiveTab] = useState('live')

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
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
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Bring Your Vision to Life with
                <span className="text-[#40B5E5]"> Professional Video</span>
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12">
                Create engaging content that connects with your congregation through
                professional video production and live streaming solutions.
                Expert support every step of the way.
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button 
                onClick={() => document.getElementById('quote-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-10 py-5 bg-[#40B5E5] text-white rounded-xl 
                         font-medium hover:bg-[#7DD3F7] transition-all duration-300 
                         transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Get Your Free Consultation
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>

            {/* Service Highlights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16"
            >
              {highlights.map((highlight, index) => (
                <div 
                  key={highlight.title}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 
                           hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-3 bg-[#40B5E5]/20 rounded-xl">
                      <highlight.icon className="w-6 h-6 text-[#40B5E5]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{highlight.title}</h3>
                      <p className="text-white/80 text-sm">{highlight.description}</p>
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