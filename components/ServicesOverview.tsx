'use client'

import Image from 'next/image'
import { Headphones, Video, Settings, HeadphonesIcon, Wrench, Users, ChevronRight, Speaker } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'
import { useRouter } from 'next/navigation'

// Image paths
const IMAGES = {
  assessment: '/images/about/sound-system.jpg',
  streaming: '/images/about/streaming.jpg',
  training: '/images/about/training.jpg'
} as const

const services = [
  {
    title: "Getting Started",
    subtitle: "Initial Assessment & Consultation",
    description: "Comprehensive evaluation of your church's audio and streaming needs",
    icon: Headphones,
    category: "Audio",
    features: [
      "On-site or virtual evaluation",
      "Personalized recommendations",
      "Technical troubleshooting",
      "Budget considerations"
    ],
    image: IMAGES.assessment,
    sectionId: "getting-started-initial-assessment-consultation"
  },
  {
    title: "Live Streaming Setup",
    subtitle: "Professional Setup & Management",
    description: "Complete streaming solution for churches with existing equipment",
    icon: Video,
    category: "Streaming",
    features: [
      "Full streaming setup",
      "Multi-platform integration",
      "Crystal-clear audio",
      "Staff training included"
    ],
    image: IMAGES.streaming,
    sectionId: "professional-live-streaming-setup-management"
  },
  {
    title: "Audio Team Training",
    subtitle: "Comprehensive Training Program",
    description: "Complete training program for your audio team",
    icon: Users,
    category: "Training",
    features: [
      "Hands-on workshops",
      "Live mixing techniques",
      "Troubleshooting strategies",
      "Ongoing support"
    ],
    image: IMAGES.training,
    sectionId: "comprehensive-audio-team-training"
  },
  {
    title: "Sound System Optimization",
    subtitle: "Professional Audio Tuning",
    description: "Expert optimization of your existing sound system for crystal-clear audio",
    icon: Settings,
    category: "Audio",
    features: [
      "System diagnostics",
      "Equipment calibration",
      "Acoustic adjustment",
      "Performance testing"
    ],
    image: IMAGES.assessment,
    sectionId: "sound-system-optimization"
  },
  {
    title: "Custom Audio Solutions",
    subtitle: "Tailored System Design",
    description: "Custom-designed audio solutions for your specific needs and space",
    icon: Wrench,
    category: "Audio",
    features: [
      "Custom system design",
      "Equipment selection",
      "Installation planning",
      "Budget optimization"
    ],
    image: IMAGES.assessment,
    sectionId: "custom-audio-solutions"
  }
]

export default function ServicesOverview() {
  const router = useRouter()

  return (
    <section className="py-24 overflow-hidden bg-gray-50">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2.5 bg-brand-blue/10 rounded-xl">
                <Speaker className="w-6 h-6 text-brand-blue" />
              </div>
              <span className="text-brand-blue font-semibold">Our Services</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Comprehensive Audio Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional audio and streaming solutions tailored for your church's unique needs
            </p>
          </div>
        </ScrollAnimation>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <ScrollAnimation 
              key={service.title}
              type="fade-up"
              delay={0.2 * index}
            >
              <div 
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-blue/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/services#${service.sectionId}`)}
              >
                {/* Image Container */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <service.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white/90 text-sm font-medium">{service.category}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-1">{service.title}</h3>
                    <p className="text-sm text-white/80">{service.subtitle}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-3 text-gray-600">
                        <ChevronRight className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6">
                  <div 
                    className="inline-flex items-center text-brand-blue hover:text-brand-blue/80 text-sm font-medium"
                  >
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}

