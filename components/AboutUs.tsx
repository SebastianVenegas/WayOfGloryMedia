'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, Target, Shield, Award, ChevronRight } from 'lucide-react'
import ScrollAnimation from './ui/scroll-animation'
import { motion } from 'framer-motion'

const values = [
  {
    title: "Our Mission",
    description: "Empowering churches with cutting-edge technology to amplify their message and reach more people.",
    icon: Target,
    highlight: "Purpose Driven",
    color: "from-blue-500/20 to-blue-600/20"
  },
  {
    title: "Our Values",
    description: "Built on integrity, excellence, and a deep commitment to serving the church community.",
    icon: Heart,
    highlight: "Faith First",
    color: "from-blue-500/20 to-blue-600/20"
  },
  {
    title: "Our Promise",
    description: "Delivering reliable, professional solutions with exceptional support every step of the way.",
    icon: Shield,
    highlight: "Always Reliable",
    color: "from-blue-500/20 to-blue-600/20"
  }
]

export default function AboutUs() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-blue-100/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-blue-100/30 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header Section */}
        <ScrollAnimation type="fade-up">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Star className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-blue-600 font-medium">Our Story</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Transforming Church Technology Through
              <span className="relative ml-3">
                Innovation
                <svg aria-hidden="true" viewBox="0 0 418 42" className="absolute left-0 top-2/3 h-[0.58em] w-full fill-blue-500/20" preserveAspectRatio="none">
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
                </svg>
              </span>
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <p className="text-xl text-gray-600">
                Founded with a vision to revolutionize church technology,
                we've spent years perfecting the art of church audio and digital solutions.
              </p>
              <p className="text-xl text-gray-600">
                Our team combines technical expertise with a deep understanding of church needs,
                creating solutions that enhance worship experiences and build stronger communities.
              </p>
            </div>
          </div>
        </ScrollAnimation>

        {/* Main Image Section */}
        <ScrollAnimation type="fade-up" delay={0.2}>
          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden mb-20 shadow-2xl">
            <Image
              src="/images/about/optimization.jpg"
              alt="Our team at work"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            
            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="max-w-3xl">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-medium">Excellence in Service</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Southern California's Premier Church Technology Partner
                </h3>
                <p className="text-white/90 text-lg max-w-2xl">
                  With over a decade of experience, we've helped countless churches transform their 
                  audio and digital presence, making technology work seamlessly for their mission.
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {values.map((value, index) => (
            <ScrollAnimation
              key={value.title}
              type="fade-up"
              delay={0.1 * index}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative group rounded-2xl overflow-hidden bg-white p-8 border border-gray-100 hover:border-blue-200 transition-colors duration-300"
              >
                {/* Value Background */}
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br ${value.color} rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="w-7 h-7 text-blue-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 mb-6 text-lg">{value.description}</p>

                  {/* Highlight Badge */}
                  <div className="inline-flex items-center text-sm text-blue-600 font-medium">
                    <span>{value.highlight}</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </motion.div>
            </ScrollAnimation>
          ))}
        </div>

        {/* CTA Section */}
        <ScrollAnimation type="fade-up" delay={0.3}>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative p-8 sm:p-12">
              <div className="max-w-3xl mx-auto text-center text-white">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Your Journey?</h3>
                <p className="text-white/90 mb-8">
                  Let's work together to create the perfect audio and digital solution for your church.
                </p>
                <Link 
                  href="/#quote"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-medium 
                           hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Schedule Your Free Consultation
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}

