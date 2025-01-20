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
  ChevronDown
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import QuoteSection from '../../components/QuoteSection'
import Image from 'next/image'
import ScrollAnimation from '../../components/ui/scroll-animation'

const services = [
  {
    title: "Getting Started: Initial Assessment & Consultation",
    description: "Comprehensive evaluation of your church's audio and streaming needs",
    includes: [
      "On-site or virtual evaluation of existing audio & streaming setup",
      "Personalized recommendations for improvement & upgrades",
      "Technical troubleshooting & optimization strategies",
      "Discussion of church-specific needs & budget considerations"
    ],
    note: "Complimentary consultation for qualified projects",
    icon: Headphones
  },
  {
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
    icon: Video
  },
  {
    title: "Church Sound System Optimization",
    description: "Professional audio system tuning and optimization",
    includes: [
      "Comprehensive audio assessment & system diagnostics",
      "Mixer & microphone calibration for optimal clarity",
      "Acoustic adjustment to eliminate echo & distortion",
      "Basic staff training on system operation"
    ],
    upgrades: [
      "Advanced System Tuning",
      "Extended Staff Training",
      "Feedback Elimination System"
    ],
    icon: Settings
  },
  {
    title: "Ongoing Audio Support Subscription",
    description: "Flexible monthly support and maintenance packages",
    includes: [
      "Regular system check-ups & maintenance",
      "Remote support for troubleshooting",
      "Priority emergency support",
      "Access to exclusive tech training sessions"
    ],
    note: "Flexible plans to fit your budget",
    icon: HeadphonesIcon
  },
  {
    title: "Custom Audio System Design",
    description: "Tailored audio solution design for your church",
    includes: [
      "Custom sound system blueprints",
      "Equipment recommendations & cost planning",
      "Site acoustic evaluation for best placement",
      "Integration with existing church infrastructure"
    ],
    note: "Free consultation for new projects",
    icon: Wrench
  },
  {
    title: "Comprehensive Audio Team Training",
    description: "Complete training program for your audio team",
    includes: [
      "Hands-on workshops for volunteers & staff",
      "Live mixing techniques for balanced sound during services",
      "Troubleshooting strategies for audio issues",
      "Custom training guides for ongoing reference",
      "Certification upon completion"
    ],
    upgrades: [
      "Advanced Mixing Techniques",
      "Custom Training Plan",
      "One-on-One Expert Coaching"
    ],
    note: "Group rates available",
    icon: Users
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

const heroImages = [
  '/images/hero1.jpg',
  '/images/hero2.jpg',
  '/images/hero3.jpg'
]

export default function ServicesPage() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(timer)
  }, [])
  
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
          {heroImages.map((image, index) => (
            <div
              key={image}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: currentImageIndex === index ? 1 : 0 }}
            >
              <Image
                src={image}
                alt="Church audio services"
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-[#0A1A3B]/60 backdrop-blur-[2px]" />
            </div>
          ))}
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-[blob_7s_infinite]" />
            <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-[blob_9s_infinite]" />
            <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-[blob_8s_infinite]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollAnimation animation="fade-up">
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

        {/* Services Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
          <ScrollAnimation animation="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center justify-center space-x-2 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Headphones className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-blue-600 font-semibold">Our Services</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0A1A3B] mb-6 leading-tight">
                Comprehensive Audio Solutions
              </h2>
              <p className="text-xl text-gray-600">
                Professional audio solutions tailored for your church's unique needs
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon
              const isExpanded = expandedCard === index

              return (
                <ScrollAnimation 
                  key={service.title}
                  animation="fade-up"
                  delay={0.2 * index}
                >
                  <div
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg 
                             transition-all duration-300 animate-fade-in-up cursor-pointer h-fit"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={(e) => toggleCard(index, e)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-blue-50 rounded-lg transform group-hover:scale-105 transition-all duration-300">
                            <Icon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#0A1A3B] group-hover:text-blue-600 
                                       transition-colors duration-300">
                              {service.title.split(':')[0]}
                            </h3>
                            <p className="text-gray-500 text-sm mt-0.5">
                              {service.title.split(':')[1]}
                            </p>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      <p className="text-gray-600 mb-4">
                        {service.description}
                      </p>

                      <div 
                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out`}
                        style={{ 
                          gridTemplateRows: isExpanded ? '1fr' : '0fr'
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div>
                              <h4 className="text-sm font-bold text-[#0A1A3B] uppercase tracking-wider mb-3">
                                What's Included
                              </h4>
                              <ul className="space-y-3">
                                {service.includes.map((item, i) => (
                                  <li 
                                    key={item} 
                                    className="flex items-start text-gray-600 group/item"
                                  >
                                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0 group-hover/item:scale-110 transition-transform duration-300" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {service.upgrades && (
                              <div className="flex items-center p-3 rounded-lg text-gray-600 border border-gray-200 bg-gray-50/50">
                                <Plus className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                                <span className="text-sm">Upgrades Available</span>
                              </div>
                            )}

                            {service.note && (
                              <p className="text-sm text-gray-500 italic">
                                {service.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              )
            })}
          </div>

          {/* Service CTAs */}
          <ScrollAnimation animation="fade-up" delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16 sticky bottom-8 z-50">
              <button
                onClick={scrollToQuote}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#0A1A3B] text-white rounded-lg
                         font-medium hover:bg-[#1E3A8A] transition-all duration-300
                         transform hover:translate-y-[-2px] hover:shadow-lg group
                         text-base"
              >
                Get Quote
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={openChat}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white border-2 border-[#0A1A3B] 
                         text-[#0A1A3B] rounded-lg font-medium hover:bg-[#F8FAFF]
                         transition-all duration-300 transform hover:translate-y-[-2px] group
                         text-base"
              >
                Chat Now
                <MessageSquare className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </ScrollAnimation>
        </section>

        {/* Trust Badge */}
        <ScrollAnimation animation="fade-up">
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