'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Wrench, Headphones, Gauge, Users } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'

// Image paths
const IMAGES = {
  soundDesign: '/images/about/sound-desighn.jpg'
} as const

const features = [
  {
    title: "Expert Design",
    description: "Tailored audio systems for every worship space",
    icon: Wrench,
    highlight: "Custom Solutions"
  },
  {
    title: "Professional Setup",
    description: "Crystal-clear sound from day one",
    icon: Gauge,
    highlight: "Perfect Sound"
  },
  {
    title: "Ongoing Support",
    description: "24/7 help to keep your services running",
    icon: Headphones,
    highlight: "Always Available"
  },
  {
    title: "Team Training",
    description: "Empower your team with hands-on workshops",
    icon: Users,
    highlight: "Knowledge Transfer"
  }
]

export default function AboutUs() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <Star className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="text-brand-blue font-medium">About Us</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Church Audio Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We specialize in creating crystal-clear sound experiences for churches of all sizes.
            </p>
          </div>
        </ScrollAnimation>

        {/* Image Section */}
        <ScrollAnimation type="fade-up" delay={0.2}>
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-16">
            <Image
              src={IMAGES.soundDesign}
              alt="Professional sound design"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </ScrollAnimation>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <ScrollAnimation 
              key={feature.title} 
              type="fade-up" 
              delay={0.2 * index}
            >
              <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand-blue" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* CTA Button */}
        <ScrollAnimation type="fade-up" delay={0.6}>
          <div className="text-center mt-12">
            <button 
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center px-8 py-3 text-lg font-medium bg-[#B7D1FF] text-gray-900 rounded-xl hover:bg-[#a3c4ff] transition-colors"
            >
              Schedule Your Free Consultation
            </button>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}

