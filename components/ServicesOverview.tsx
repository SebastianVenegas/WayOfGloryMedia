'use client'

import Image from 'next/image'
import { Headphones, Video, Settings, ChevronRight, Speaker, Globe, Smartphone } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Image paths
const IMAGES = {
  webDev: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
  appDev: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2340&auto=format&fit=crop',
  audioSystem: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=2370&auto=format&fit=crop',
  streaming: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?q=80&w=2340&auto=format&fit=crop',
  optimization: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2370&auto=format&fit=crop'
} as const

const services = [
  {
    title: "Website Development",
    subtitle: "Modern Digital Presence",
    description: "Create a stunning online presence with our professional church website development. We build responsive, user-friendly websites that engage your community.",
    icon: Globe,
    category: "Digital",
    features: [
      "Custom website design",
      "Mobile-responsive layouts",
      "Content management system",
      "Event management",
      "Online giving integration",
      "SEO optimization"
    ],
    image: IMAGES.webDev,
    sectionId: "website-development"
  },
  {
    title: "Mobile App Development",
    subtitle: "Custom Church Apps",
    description: "Connect with your congregation through custom mobile apps. Provide easy access to sermons, events, and community features.",
    icon: Smartphone,
    category: "Digital",
    features: [
      "iOS and Android apps",
      "Push notifications",
      "Event calendars",
      "Prayer requests",
      "Sermon libraries",
      "Community features"
    ],
    image: IMAGES.appDev,
    sectionId: "app-development"
  },
  {
    title: "Audio System Design",
    subtitle: "Professional Sound Solutions",
    description: "Get crystal-clear sound with our professional audio system design and installation services",
    icon: Headphones,
    category: "Audio",
    features: [
      "Custom system design",
      "Professional installation",
      "Sound optimization",
      "Ongoing maintenance"
    ],
    image: IMAGES.audioSystem,
    sectionId: "audio-system-design"
  },
  {
    title: "Live Streaming",
    subtitle: "Broadcast & Recording",
    description: "Reach your congregation anywhere with high-quality live streaming and recording solutions",
    icon: Video,
    category: "Streaming",
    features: [
      "HD video streaming",
      "Multi-platform broadcasting",
      "Professional recording",
      "Easy-to-use systems"
    ],
    image: IMAGES.streaming,
    sectionId: "live-streaming"
  },
  {
    title: "Sound Optimization",
    subtitle: "Expert Audio Tuning",
    description: "Maximize your sound system's potential with professional tuning and optimization",
    icon: Settings,
    category: "Optimization",
    features: [
      "Acoustic analysis",
      "System calibration",
      "Equipment testing",
      "Sound balancing"
    ],
    image: IMAGES.optimization,
    sectionId: "sound-optimization"
  }
]

export default function ServicesOverview() {
  const router = useRouter()

  const scrollToQuote = () => {
    const quoteSection = document.getElementById('quote')
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="py-24 overflow-hidden bg-gray-50">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Speaker className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 font-semibold">Our Services</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Technology Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elevate your church's presence with our comprehensive digital and audio solutions. From websites and mobile apps to professional sound systems and live streaming.
            </p>
          </div>
        </ScrollAnimation>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-y-8 max-w-7xl mx-auto">
          {/* Top Row - First 3 Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service, index) => (
              <ScrollAnimation 
                key={service.title}
                type="fade-up"
                delay={0.2 * index}
              >
                <div 
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl 
                            transition-all duration-300 flex flex-col relative h-full"
                >
                  {/* Image Container */}
                  <div 
                    className="relative h-72 overflow-hidden cursor-pointer group"
                    onClick={() => router.push(`/services#${service.sectionId}`)}
                  >
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                      className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 brightness-[0.85]"
                      priority
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                          <service.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white/90 text-sm font-medium tracking-wide uppercase">{service.category}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
                      <p className="text-sm text-white/90 font-medium">{service.subtitle}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-grow flex flex-col justify-between relative">
                    <div>
                      <p className="text-gray-600 text-sm mb-8 leading-relaxed">{service.description}</p>
                      <ul className="space-y-4">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start space-x-3 text-gray-600 group">
                            <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-8 left-8 right-8 pt-4 border-t border-gray-100 bg-white">
                      <Link 
                        href={service.category === "Digital" 
                          ? "/services/digital" 
                          : `/services#${service.sectionId}`}
                        className="group inline-flex items-center text-blue-600 hover:text-blue-700 text-base font-medium 
                                 transition-colors relative z-50 pointer-events-auto"
                      >
                        Learn More
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>

          {/* Bottom Row - Last 2 Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[66%] mx-auto">
            {services.slice(3).map((service, index) => (
              <ScrollAnimation 
                key={service.title}
                type="fade-up"
                delay={0.2 * (index + 3)}
              >
                <div 
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl 
                            transition-all duration-300 flex flex-col relative h-full"
                >
                  {/* Image Container */}
                  <div 
                    className="relative h-72 overflow-hidden cursor-pointer group"
                    onClick={() => router.push(`/services#${service.sectionId}`)}
                  >
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 brightness-[0.85]"
                      priority
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                          <service.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white/90 text-sm font-medium tracking-wide uppercase">{service.category}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
                      <p className="text-sm text-white/90 font-medium">{service.subtitle}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-grow flex flex-col justify-between relative">
                    <div>
                      <p className="text-gray-600 text-sm mb-8 leading-relaxed">{service.description}</p>
                      <ul className="space-y-4">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start space-x-3 text-gray-600 group">
                            <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Footer */}
                    <div className="absolute bottom-8 left-8 right-8 pt-4 border-t border-gray-100 bg-white">
                      <Link 
                        href={service.category === "Digital" 
                          ? "/services/digital" 
                          : `/services#${service.sectionId}`}
                        className="group inline-flex items-center text-blue-600 hover:text-blue-700 text-base font-medium 
                                 transition-colors relative z-50 pointer-events-auto"
                      >
                        Learn More
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

