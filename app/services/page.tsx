'use client'

import { type ReactElement } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Headphones, Video, Settings, Users, Wrench, Speaker, Mic, Music, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import ScrollAnimation from '../../components/ui/scroll-animation'
import { useState, useEffect } from 'react'
import QuoteSection from '../../components/QuoteSection'

const services = [
  {
    id: "146",
    title: "Monthly Maintenance",
    subtitle: "Preventive System Care",
    description: "Keep Your Systems Running Smoothly with Monthly Maintenance. Prevent audio and streaming issues before they affect your services.",
    icon: Wrench,
    image: '/images/about/maintenance.jpg',
    features: [
      "Regular Inspections: Thorough checks of all audio and streaming equipment",
      "Equipment Services: Remove dust and debris to maintain equipment longevity",
      "Performance Testing: Ensure all systems are functioning correctly",
      "System Updates: Regular software and firmware updates",
      "Preventive Maintenance: Address potential issues before they occur",
      "Documentation: Maintain detailed service records"
    ],
    benefits: [
      "Consistent system performance",
      "Extended equipment life",
      "Minimized downtime",
      "Peace of mind"
    ]
  },
  {
    id: "147",
    title: "Live Service Audio Support",
    subtitle: "Real-Time Audio Excellence",
    description: "Seamless Audio for Every Live Service. Our team provides on-site or remote audio support during live services. We ensure clear, consistent sound throughout your worship experience.",
    icon: Headphones,
    image: '/images/about/live-support.jpg',
    features: [
      "On-Site Support: Professional audio technicians present during services",
      "Remote Support: Virtual assistance for audio setup and troubleshooting",
      "Real-Time Mixing: Balance audio levels for clear and consistent sound",
      "Technical Monitoring: Continuous system performance oversight",
      "Immediate Response: Quick resolution of audio issues",
      "Service Documentation: Detailed reports and recommendations"
    ],
    benefits: [
      "Professional sound quality",
      "Immediate technical support",
      "Consistent audio experience",
      "Peace of mind during services"
    ]
  },
  {
    id: "148",
    title: "Equipment Analysis",
    subtitle: "Professional Assessment",
    description: "Optimize Your Setup with Professional Equipment Analysis. Our experts conduct a comprehensive assessment of your audio and streaming equipment to ensure optimal performance.",
    icon: Settings,
    image: '/images/about/analysis.jpg',
    features: [
      "Detailed Equipment Assessment: Comprehensive review of all audio and streaming gear",
      "Performance Evaluation: Identify strengths and areas for improvement",
      "Issue Identification: Pinpoint technical problems affecting performance",
      "Equipment Testing: Thorough analysis of all components",
      "System Integration Review: Evaluate how systems work together",
      "Future Planning: Recommendations for upgrades and improvements"
    ],
    benefits: [
      "Optimized system performance",
      "Clear upgrade path",
      "Cost-effective solutions",
      "Long-term reliability"
    ]
  },
  {
    id: "149",
    title: "Sound Optimization",
    subtitle: "Perfect Audio Balance",
    description: "Achieve Perfect Sound with Expert Sound Optimization. We fine-tune your audio systems to achieve clear, balanced sound throughout your venue.",
    icon: Music,
    image: '/images/about/optimization.jpg',
    features: [
      "System Calibration: Fine-tune audio settings for optimal performance",
      "Feedback Reduction: Implement strategies to minimize and eliminate feedback",
      "Audio Clarity Enhancement: Improve sound quality for clearer sermons and music",
      "Acoustic Analysis: Evaluate and optimize room acoustics",
      "Speaker Alignment: Perfect positioning and timing",
      "EQ Optimization: Professional frequency balancing"
    ],
    benefits: [
      "Crystal-clear sound",
      "Eliminated audio issues",
      "Balanced coverage",
      "Enhanced worship experience"
    ]
  },
  {
    id: "150",
    title: "Live Service Broadcasting Support",
    subtitle: "Professional Streaming",
    description: "Expand Your Reach with Professional Live Broadcasting. Enhance your church's reach with our live broadcasting assistance.",
    icon: Video,
    image: '/images/about/broadcasting.jpg',
    features: [
      "Comprehensive Streaming Setup: Integrate video and audio for seamless broadcasts",
      "Platform Configuration: Setup and optimize streaming on Facebook, YouTube, and your website",
      "Real-Time Monitoring: Ensure smooth streaming with live oversight",
      "Quality Control: Monitor and adjust broadcast quality",
      "Multi-Platform Management: Coordinate streaming across platforms",
      "Technical Support: Immediate assistance for streaming issues"
    ],
    benefits: [
      "Professional broadcast quality",
      "Wider ministry reach",
      "Reliable streaming",
      "Technical peace of mind"
    ]
  },
  {
    id: "151",
    title: "Audio Equipment Training",
    subtitle: "Expert Team Development",
    description: "Empower Your Team with Expert Audio Training. We provide hands-on training for church staff and volunteers to master your audio systems.",
    icon: Users,
    image: '/images/about/training.jpg',
    features: [
      "Comprehensive Training Sessions: From beginner to advanced levels",
      "Soundboard Operation: Master the basics and advanced mixing techniques",
      "Microphone Management: Proper placement and usage for optimal sound",
      "System Troubleshooting: Learn to identify and resolve common issues",
      "Live Mix Training: Hands-on experience with live audio",
      "Ongoing Support: Resources and documentation for continued learning"
    ],
    benefits: [
      "Confident audio team",
      "Improved sound quality",
      "Reduced technical issues",
      "Self-sufficient operation"
    ]
  }
]

const heroImages = [
  {
    src: "/images/hero1 2.jpg",
    alt: "Professional church audio"
  },
  {
    src: "/images/hero2 2.jpg",
    alt: "Live streaming setup"
  },
  {
    src: "/images/hero3 2.jpg",
    alt: "Audio equipment"
  }
]

export default function ServicesPage(): ReactElement {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const scrollToQuote = () => {
    const quoteSection = document.getElementById('quote-section')
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Subtle gradient overlay for the entire page */}
      <div className="fixed inset-0 bg-gradient-to-br from-neutral-50/30 via-transparent to-stone-50/20 pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Background Images */}
        {heroImages.map((image, index) => (
          <div
            key={image.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover brightness-[0.45] backdrop-blur-[2px]"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
          </div>
        ))}

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-6 py-2.5 text-sm text-white mb-8">
            <span className="flex items-center">
              Trusted by 50+ Churches in Southern California
            </span>
          </div>

          {/* Main Content */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Professional Church<br />Audio Solutions
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10 backdrop-blur-sm">
            From sound system design to live streaming setup, we provide
            comprehensive solutions to enhance your worship experience.
          </p>

          <button 
            onClick={scrollToQuote}
            className="inline-flex items-center px-10 py-5 bg-white text-gray-900 rounded-xl font-medium 
                     hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl 
                     transform hover:-translate-y-1"
          >
            Get Your Free Quote
          </button>

          {/* Dot Navigation */}
          <div className="flex justify-center gap-4 mt-16">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Card */}
      <div className="relative z-10 -mt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation
            type="fade-up"
            className="scroll-mt-24"
            delay={0.2}
          >
            <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-10 border border-blue-100/50 
                          hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start gap-6 mb-8">
                <div className="p-3.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Expert Consultation</h3>
                  <p className="text-lg text-gray-600">Custom Audio & Streaming Assessment</p>
                </div>
              </div>

              <p className="text-gray-700 mb-8 leading-relaxed">
                Get a personalized streaming and audio solution designed by our experts
                to perfectly match your church's needs and budget.
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-8 mb-8 border border-blue-100/50">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Professional Assessment</h4>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-bold text-blue-600">$250</span>
                  <span className="text-gray-500 font-medium">/consultation</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Value credited towards your custom bundle</p>
              </div>

              <div className="mb-8">
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 text-gray-700">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
                    <span className="font-medium">Expert evaluation of your needs</span>
                  </li>
                  <li className="flex items-center gap-4 text-gray-700">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
                    <span className="font-medium">Custom streaming & audio bundle</span>
                  </li>
                  <li className="flex items-center gap-4 text-gray-700">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
                    <span className="font-medium">Professional recommendations</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={scrollToQuote}
                className="w-full py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl 
                         font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 
                         shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Schedule Your Expert Consultation
              </button>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Add spacing after consultation card */}
      <div className="h-32 bg-gradient-to-b from-neutral-50 to-white"></div>

      {/* Services Introduction */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <ScrollAnimation type="fade-up" className="scroll-mt-24">
          <div className="text-center max-w-4xl mx-auto relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl"></div>
              <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50/30 rounded-full blur-2xl"></div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center justify-center space-x-2 mb-6">
              <div className="bg-blue-50 rounded-full px-4 py-2 shadow-sm border border-blue-100/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.5 2H12V9L10.2 7.2L8.4 9V2H6.5C4.01472 2 2 4.01472 2 6.5V17.5C2 19.9853 4.01472 22 6.5 22H17.5C19.9853 22 22 19.9853 22 17.5V10.5M22 6L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-blue-600 font-semibold text-sm">Our Services</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 tracking-tight leading-[1.1]">
              Comprehensive Audio Solutions
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-12">
              Professional audio and streaming solutions tailored for your church's unique needs. 
              Our expert team ensures crystal-clear sound and seamless streaming for every service.
            </p>

            {/* Decorative Elements */}
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent rounded-full"></div>
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent rounded-full mx-auto mt-1.5"></div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>

      {/* Services Grid Section */}
      <section className="py-24 bg-gradient-to-b from-white via-neutral-50/20 to-neutral-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ScrollAnimation 
                key={service.id}
                type="fade-up"
                className="scroll-mt-24"
                id={service.id}
              >
                <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 
                              overflow-hidden border border-neutral-100 h-full flex flex-col 
                              transform hover:-translate-y-1">
                  {/* Service Image */}
                  <div className="relative h-48">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                          <service.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/90 text-sm font-medium">{service.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Content */}
                  <div className="p-8 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 text-sm mb-8">{service.description}</p>

                    {/* Features */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Features & Capabilities</h4>
                        <ul className="space-y-2.5">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 mr-2"></div>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Key Benefits</h4>
                        <ul className="space-y-2.5">
                          {service.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 mr-2"></div>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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