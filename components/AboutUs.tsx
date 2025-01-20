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
    <section className="relative py-16 overflow-hidden bg-white">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimation animation="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <Star className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="text-brand-blue font-medium uppercase tracking-wider text-sm">Our Mission</span>
            </div>
            <h2 className="text-[2.75rem] font-bold text-gray-900 mb-4 tracking-tight">
              Transform Your Worship with<br />Crystal-Clear Audio Solutions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience flawless sound tailored to inspire and connect your congregation. We combine technical expertise with a deep understanding of worship environments.
            </p>
          </div>
        </ScrollAnimation>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
          <ScrollAnimation animation="fade-right" delay={0.2}>
            <div className="relative">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-blue/5 rounded-full"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-blue/10 rounded-full"></div>
              <div className="relative z-10">
                <Image
                  src={IMAGES.soundDesign}
                  alt="Professional audio mixing console"
                  width={600}
                  height={400}
                  className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="fade-left" delay={0.4}>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Setting the Standard in Church Audio
              </h3>
              <p className="text-gray-600 leading-relaxed">
                At WayofGlory, we believe that clear, pristine audio is essential for an immersive worship experience. We deliver solutions that enhance every service, ensuring your message reaches every heart.
              </p>
            </div>
          </ScrollAnimation>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <ScrollAnimation 
              key={feature.title} 
              animation="fade-up" 
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
        <ScrollAnimation animation="fade-up" delay={0.6}>
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

