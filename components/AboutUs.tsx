'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Wrench, Headphones, Gauge, Users, Code, Globe, Smartphone, Video } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'

// Image paths
const IMAGES = {
  soundDesign: '/images/about/optimization.jpg'
} as const

const features = [
  {
    title: "Modern Websites",
    description: "Beautiful, responsive church websites that engage your community",
    icon: Globe,
    highlight: "Digital Presence"
  },
  {
    title: "Custom Apps",
    description: "Tailored mobile apps for seamless congregation connection",
    icon: Smartphone,
    highlight: "Mobile Solutions"
  },
  {
    title: "Live Streaming",
    description: "Professional streaming setup for reaching your congregation anywhere",
    icon: Video,
    highlight: "Broadcast Ready"
  },
  {
    title: "Expert Audio",
    description: "Crystal-clear sound for every worship space",
    icon: Headphones,
    highlight: "Perfect Sound"
  },
  {
    title: "Tech Support",
    description: "24/7 support for all your digital and audio needs",
    icon: Wrench,
    highlight: "Always Available"
  }
]

export default function AboutUs() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-blue-600 font-medium">About Us</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Church Technology Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We specialize in creating powerful digital experiences and crystal-clear sound solutions for churches of all sizes.
              From modern websites and live streaming to custom mobile apps, we help you connect with your congregation both online and in person.
            </p>
          </div>
        </ScrollAnimation>

        {/* Image Section */}
        <ScrollAnimation type="fade-up" delay={0.2}>
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-16 shadow-xl">
            <Image
              src={IMAGES.soundDesign}
              alt="Professional church technology solutions"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </ScrollAnimation>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {features.map((feature, index) => (
            <ScrollAnimation 
              key={feature.title} 
              type="fade-up" 
              delay={0.2 * index}
            >
              <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* CTA Button */}
        <div className="relative z-50 text-center mt-16">
          <Link 
            href="/#quote"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium 
                     px-8 py-4 rounded-xl relative z-50 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Schedule Your Free Consultation
          </Link>
        </div>
      </div>
    </section>
  )
}

