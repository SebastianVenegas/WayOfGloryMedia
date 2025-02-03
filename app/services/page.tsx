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

  const toggleCard = (index: number, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setExpandedCard(expandedCard === index ? null : index)
  }

  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 py-20 px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Our Services
            </h1>
            <p className="mt-6 text-xl text-blue-100">
              Professional audio and video solutions for your church
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              isExpanded={expandedCard === index}
              onToggle={(e) => toggleCard(index, e)}
            />
          ))}
          
          {/* Custom Service Button */}
          <div className="relative group rounded-2xl border-2 border-dashed border-gray-300 p-8 hover:border-blue-500 transition-colors duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
               onClick={openChat}>
            <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors duration-300">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Create Custom Service</h3>
            <p className="mt-2 text-sm text-gray-500">
              Don't see what you need? Let's create a custom solution for your church.
            </p>
          </div>
        </div>
      </div>

      {/* Rest of the components */}
      <QuoteSection />
      <Footer />
    </div>
  )
} 