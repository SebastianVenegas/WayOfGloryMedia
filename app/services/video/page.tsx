'use client'

import { type ReactElement } from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
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
            className="object-cover brightness-[0.3]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/80 via-[#0F172A]/60 to-transparent" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                  <Film className="w-4 h-4 text-[#40B5E5]" />
                  <span className="text-white/80 text-sm">Professional Video Production</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                  Bring Your
                  <span className="block text-[#40B5E5]">Vision to Life</span>
                </h1>

                <p className="text-xl text-white/80 mb-12 max-w-xl">
                  Professional video production and live streaming solutions for churches. 
                  Create engaging content that connects with your congregation.
                </p>

                <button
                  onClick={() => document.getElementById('quote-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative overflow-hidden px-8 py-4 bg-[#40B5E5] rounded-xl 
                           text-white font-medium inline-flex items-center justify-center shadow-lg shadow-[#40B5E5]/20
                           hover:bg-[#40B5E5]/90 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center">
                    Start Your Project
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            </div>

            {/* Right Content - Service Tabs */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8">
                  {[
                    { id: 'live', label: 'Live Streaming', icon: Video },
                    { id: 'production', label: 'Video Production', icon: Film },
                    { id: 'equipment', label: 'Equipment', icon: Camera }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#40B5E5] text-white shadow-md'
                          : 'text-gray-600 hover:bg-[#40B5E5]/10'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`transition-all duration-300 ${
                        (activeTab === 'live' && service.id === '201') ||
                        (activeTab === 'production' && service.id === '202') ||
                        (activeTab === 'equipment' && service.id === '203')
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 translate-x-4 hidden'
                      }`}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {service.features.slice(0, 4).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 bg-[#40B5E5]/5 rounded-xl p-4 hover:bg-[#40B5E5]/10 transition-colors"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#40B5E5] mt-2" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
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