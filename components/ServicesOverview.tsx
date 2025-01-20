import Image from 'next/image'
import Link from 'next/link'
import { Mic2, Radio, Users2, ChevronRight, Speaker } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'

// Image paths
const IMAGES = {
  soundSystem: '/images/about/sound-system.jpg',
  streaming: '/images/about/streaming.jpg',
  training: '/images/about/training.jpg'
} as const

const services = [
  {
    title: "Sound System Design",
    description: "Transform your worship space with crystal-clear audio that reaches every corner. Our expert design ensures perfect acoustics and immersive sound quality.",
    icon: Mic2,
    features: [
      "Custom acoustic analysis & modeling",
      "Strategic speaker placement",
      "Professional mixing console setup",
      "Complete system integration"
    ],
    image: IMAGES.soundSystem
  },
  {
    title: "Live Streaming Setup",
    description: "Connect with your virtual congregation through high-quality live streaming. Professional equipment and setup for flawless online services.",
    icon: Radio,
    features: [
      "4K video production system",
      "Multi-camera setup & control",
      "Real-time stream monitoring",
      "Cloud recording & archiving"
    ],
    image: IMAGES.streaming
  },
  {
    title: "Training & Support",
    description: "Empower your tech team with comprehensive training and ongoing support. We ensure your team can confidently manage every service.",
    icon: Users2,
    features: [
      "Hands-on equipment training",
      "Live mixing workshops",
      "24/7 technical support",
      "Regular system maintenance"
    ],
    image: IMAGES.training
  }
]

export default function ServicesOverview() {
  return (
    <section className="py-12 overflow-hidden bg-white">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation animation="fade-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <Speaker className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="text-brand-blue font-medium text-sm">Professional Services</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Elevate Your Worship Experience
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              From system design to ongoing support, we provide comprehensive solutions that transform your church's audio experience.
            </p>
          </div>
        </ScrollAnimation>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ScrollAnimation 
              key={service.title}
              animation="fade-up"
              delay={0.2 * index}
            >
              <div className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-brand-blue/20 transition-colors duration-300">
                {/* Image Container */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                      <service.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{service.title}</h3>
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
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center text-brand-blue hover:text-brand-blue/80 text-sm font-medium"
                  >
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}

