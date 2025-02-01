'use client'

import { useState, useEffect } from 'react'
import { 
  Check, 
  ArrowRight, 
  Headphones, 
  Video, 
  Settings, 
  HeadphonesIcon, 
  Wrench,
  Users,
  Plus,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import QuoteSection from '../../components/QuoteSection'
import Image from 'next/image'
import ScrollAnimation from '../../components/ui/scroll-animation'
import { cn } from '../../lib/utils'
import { LucideIcon } from 'lucide-react'
import ServiceCard from '@/components/ui/service-card'

interface Service {
  id: string
  title: string
  subtitle?: string
  description: string
  includes: string[]
  upgrades?: string[]
  note?: string
  icon: LucideIcon
  featured?: boolean
  category: string
  pricing?: {
    initial: string
    note: string
    fullAssessment: string
    fullAssessmentNote: string
  }
}

const services: Service[] = [
  {
    id: "1",
    title: "Professional Live Streaming Setup & Management",
    description: "Complete streaming solution for churches with existing equipment",
    includes: [
      "Full setup and configuration of streaming software and encoding systems",
      "Integration with existing audio systems for crystal-clear sound",
      "Multi-platform streaming setup (YouTube, Facebook, Church website, etc.)",
      "Pre-event testing & troubleshooting for smooth streaming",
      "Live stream production training for church staff"
    ],
    upgrades: [
      "2-Camera Setup",
      "3-Camera Setup",
      "Professional Equipment Package",
      "Enhanced Audio Integration",
      "On-Site Operator Support"
    ],
    note: "Custom packages available based on your needs",
    icon: Video,
    category: "Streaming"
  },
  {
    id: "146",
    title: "Audio Equipment Training",
    description: "Comprehensive training sessions for your team on audio equipment operation",
    includes: [
      "Hands-on equipment operation training",
      "Signal flow and routing instruction",
      "Troubleshooting techniques",
      "Best practices for live sound",
      "Maintenance procedures"
    ],
    upgrades: [
      "Advanced mixing techniques",
      "Digital console mastery",
      "Effects processing",
      "Recording basics"
    ],
    icon: Headphones,
    category: "Training"
  },
  {
    id: "148",
    title: "Sound Optimization",
    description: "Expert optimization of your sound system for optimal performance",
    includes: [
      "Acoustic environment analysis",
      "System tuning and calibration",
      "EQ and processing adjustment",
      "Coverage pattern optimization",
      "Sound quality enhancement"
    ],
    upgrades: [
      "Advanced room acoustics treatment",
      "Digital signal processing setup",
      "Custom presets creation"
    ],
    icon: HeadphonesIcon,
    category: "Optimization"
  },
  {
    id: "149",
    title: "Monthly Maintenance",
    description: "Regular maintenance service to keep your audio system in top condition",
    includes: [
      "Monthly system checkups",
      "Preventive maintenance",
      "Equipment cleaning",
      "Performance testing",
      "Minor repairs and adjustments"
    ],
    icon: Wrench,
    category: "Maintenance"
  },
  {
    id: "150",
    title: "Live Service Audio Support",
    description: "Professional audio support during your live services",
    includes: [
      "Live sound mixing",
      "Equipment setup and testing",
      "Real-time troubleshooting",
      "Quality monitoring",
      "Post-service system check"
    ],
    upgrades: [
      "Multi-engineer support",
      "Recording service",
      "Custom mix creation"
    ],
    icon: Users,
    category: "Support"
  },
  {
    id: "151",
    title: "Live Service Broadcasting Support",
    description: "Complete support for live broadcasting of your services",
    includes: [
      "Stream setup and monitoring",
      "Audio quality optimization",
      "Multi-platform streaming",
      "Technical troubleshooting",
      "Post-stream analytics"
    ],
    upgrades: [
      "Multi-camera integration",
      "Custom graphics package",
      "Social media integration"
    ],
    icon: Video,
    category: "Broadcasting"
  }
]

const maintenancePlans = [
  {
    title: "Monthly Care",
    features: [
      "Monthly on-site check-up",
      "Remote technical support",
      "Exclusive member discounts",
      "Priority scheduling"
    ],
    note: "Perfect for active churches"
  },
  {
    title: "Quarterly Care",
    features: [
      "Quarterly maintenance visits",
      "System updates & optimization",
      "Extended support hours",
      "Priority response time"
    ],
    note: "Most popular choice"
  },
  {
    title: "Annual Care",
    features: [
      "Comprehensive yearly service",
      "24/7 emergency support",
      "Equipment maintenance included",
      "Maximum cost savings"
    ],
    featured: true,
    note: "Best value package"
  }
]

// Preload hero images
const heroImages = [
  '/images/hero1.jpg',
  '/images/hero2.jpg',
  '/images/hero3.jpg'
]

export default function ServicesPage() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Preload images on mount
  useEffect(() => {
    const loadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new (window.Image || Image)() as HTMLImageElement
        img.onload = () => resolve()
        img.src = src
      })
    }

    Promise.all(heroImages.map(loadImage))
      .then(() => {
        setImagesLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (imagesLoaded) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [imagesLoaded])
  
  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  const openChat = () => {
    // @ts-ignore
    if (window.Tawk_API) {
      // @ts-ignore
      window.Tawk_API.maximize()
    }
  }

  const toggleCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCard(expandedCard === index ? null : index)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white pt-24">
        {/* Hero Section */}
        <section className="relative bg-[#0A1A3B] py-32 mb-24 overflow-hidden">
          {/* Hero Images */}
          {heroImages.map((src, index) => (
            <div
              key={src}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                index === 0 ? "opacity-100" : "opacity-0"
              )}
              style={{ opacity: currentImageIndex === index ? 1 : 0 }}
            >
              <Image
                src={src}
                alt="Church audio services"
                fill
                className="object-cover"
                priority={true}
                sizes="100vw"
                quality={90}
              />
              <div className="absolute inset-0 bg-[#0A1A3B]/60 backdrop-blur-[2px]" />
            </div>
          ))}

          {/* Loading placeholder */}
          <div className={cn(
            "absolute inset-0 bg-[#0A1A3B] transition-opacity duration-500",
            imagesLoaded ? "opacity-0" : "opacity-100"
          )} />
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-[blob_7s_infinite]" />
            <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-[blob_9s_infinite]" />
            <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-[blob_8s_infinite]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollAnimation type="fade-up">
              <div className="max-w-4xl mx-auto text-center">
                <div className="animate-fade-in-up">
                  <div className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    <span className="text-white/90 text-sm font-medium">Trusted by 50+ Churches in Southern California</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight animate-gradient bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-300% animate-[gradient_4s_ease-in-out_infinite]">
                    Professional Church<br />Audio Solutions
                  </h1>
                  <p className="text-xl md:text-2xl text-white/80 animate-fade-in-up delay-200 max-w-3xl mx-auto mb-12">
                    From sound system design to live streaming setup, we provide comprehensive solutions 
                    to enhance your worship experience.
                  </p>
                  <button
                    onClick={scrollToQuote}
                    className="inline-flex items-center justify-center px-8 py-3 bg-blue-100 text-[#0A1A3B] rounded-full
                             font-medium hover:bg-blue-200 transition-all duration-300
                             transform hover:translate-y-[-2px] hover:shadow-lg
                             text-lg mb-12"
                  >
                    Schedule Your Free Consultation
                  </button>
                  {/* Image Indicators */}
                  <div className="flex justify-center space-x-3">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          currentImageIndex === index 
                            ? 'bg-white scale-110' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Consultation Section */}
        <section className="relative -mt-44 mb-24 z-10">
          <ScrollAnimation type="fade-up">
            <div className="max-w-xl mx-auto px-4">
              <div className="bg-white/95 rounded-2xl shadow-md p-6 relative overflow-hidden">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#0A1A3B]">Expert Consultation</h2>
                      <p className="text-gray-500 text-sm">Custom Audio & Streaming Assessment</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-6">
                    Get a personalized streaming and audio solution designed by our experts to perfectly match your church's needs and budget
                  </p>

                  <div className="bg-blue-50/40 rounded-lg p-5 mb-6 hover:bg-blue-50/60 transition-colors duration-300">
                    <div className="text-gray-600 text-sm mb-1">Professional Assessment</div>
                    <div className="text-2xl font-semibold text-[#0A1A3B]">$250</div>
                    <div className="text-gray-500 text-sm">Value credited towards your custom bundle</div>
                  </div>

                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Expert evaluation of your needs",
                        "Custom streaming & audio bundle",
                        "Detailed cost breakdown",
                        "Professional recommendations"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={scrollToQuote}
                    className="w-full py-3 bg-[#0A1A3B] text-white rounded-lg font-medium text-sm
                             hover:bg-[#1E293B] transition-all duration-300"
                  >
                    Schedule Your Expert Consultation
                  </button>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </section>

        {/* Services Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
          <ScrollAnimation type="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center justify-center space-x-2 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Headphones className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-blue-600 font-medium">Our Services</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A1A3B] mb-4 leading-tight">
                Comprehensive Audio Solutions
              </h2>
              <p className="text-lg text-gray-600">
                Professional audio solutions tailored for your church's unique needs
              </p>
            </div>
          </ScrollAnimation>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <ScrollAnimation 
                key={service.title}
                type="fade-up"
                delay={0.1 * index}
              >
                <div className="group relative bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 h-full cursor-pointer"
                     onClick={(e) => toggleCard(index, e)}>
                  {/* Service Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="px-2.5 py-1 bg-blue-50/80 text-blue-600 rounded-full text-xs font-medium border border-blue-100/50">
                      {service.category}
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Service Icon */}
                    <div className="mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/50 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                        <service.icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {service.title}
                        </h3>
                        <ChevronDown 
                          className={cn(
                            "w-5 h-5 text-gray-500 transition-transform duration-200",
                            expandedCard === index ? "transform rotate-180" : ""
                          )}
                        />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Features */}
                    {service.includes && (
                      <div className="mb-6 overflow-hidden">
                        <div className={cn(
                          "space-y-2.5 transition-all duration-300 ease-in-out",
                          expandedCard === index ? "opacity-100 transform translate-y-0" : ""
                        )}>
                          {(expandedCard === index ? service.includes : service.includes.slice(0, 3)).map((feature, idx) => (
                            <div key={idx} 
                                 className={cn(
                                   "flex items-start gap-2 transition-all duration-300 ease-in-out",
                                   idx >= 3 && expandedCard === index 
                                     ? "opacity-100 transform translate-y-0" 
                                     : idx < 3 
                                       ? "opacity-100"
                                       : "opacity-0 transform -translate-y-4"
                                 )}>
                              <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Upgrades Section - Only show when expanded */}
                        <div className={cn(
                          "transition-all duration-300 ease-in-out",
                          expandedCard === index 
                            ? "opacity-100 transform translate-y-0 mt-4 pt-4 border-t border-gray-100" 
                            : "opacity-0 transform -translate-y-4 h-0 overflow-hidden"
                        )}>
                          {service.upgrades && (
                            <>
                              <p className="text-sm font-medium text-gray-900 mb-3">Available Upgrades:</p>
                              <div className="space-y-2">
                                {service.upgrades.map((upgrade, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <Plus className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-600 leading-tight">{upgrade}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Note - Only show when expanded */}
                        <div className={cn(
                          "transition-all duration-300 ease-in-out",
                          expandedCard === index && service.note
                            ? "opacity-100 transform translate-y-0 mt-4" 
                            : "opacity-0 transform -translate-y-4 h-0 overflow-hidden"
                        )}>
                          {service.note && (
                            <div className="text-sm text-gray-500 italic">
                              Note: {service.note}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>

          {/* Service CTAs */}
          <ScrollAnimation type="fade-up" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16">
              <button
                onClick={scrollToQuote}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#0A1A3B] text-white rounded-lg
                         font-medium hover:bg-[#1E3A8A] transition-all duration-300
                         transform hover:translate-y-[-2px] hover:shadow-lg group/btn"
              >
                Get Quote
                <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={openChat}
                className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-[#0A1A3B] 
                         text-[#0A1A3B] rounded-lg font-medium hover:bg-[#F8FAFF]
                         transition-all duration-300 transform hover:translate-y-[-2px] group/btn"
              >
                Chat Now
                <MessageSquare className="ml-2 w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
              </button>
            </div>
          </ScrollAnimation>
        </section>

        {/* Trust Badge */}
        <ScrollAnimation type="fade-up">
          <div className="bg-[#F8FAFF] py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-lg text-gray-600 animate-pulse">
                  Trusted by <span className="font-semibold text-[#0A1A3B]">50+ churches</span> in Southern California
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </main>

      {/* Quote Section */}
      <QuoteSection />
      
      <Footer />
    </>
  )
} 