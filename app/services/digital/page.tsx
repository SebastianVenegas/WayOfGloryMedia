'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '../../../components/Header'
import Footer from '@/components/Footer'
import { Globe, Smartphone, Code, Gauge, Layout, Users, Server, Shield, ChevronRight, Star, ArrowRight, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import ScrollAnimation from '../../../components/ui/scroll-animation'
import QuoteSection from '../../../components/QuoteSection'
import { motion, useAnimation, type AnimationControls } from 'framer-motion'
import { LazyMotion, domAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const features = [
  {
    title: "Custom Church Website Development",
    description: "Stunning, responsive designs that reflect your church's unique mission and values.",
    icon: Globe,
    details: [
      "Modern, mobile-first design",
      "Interactive events calendar with online registrations",
      "Prayer request submission system",
      "Online giving and donation platform",
      "Sermon archives and streaming",
      "Community engagement tools"
    ],
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=3270&auto=format&fit=crop"
  },
  {
    title: "Custom Software Solutions",
    description: "Tailored software to streamline your church's operations and enhance congregation engagement.",
    icon: Code,
    details: [
      "Tailored member management systems",
      "Bespoke event & service planning tools",
      "Custom analytics & reporting dashboards",
      "Integrated communication platforms",
      "Customized financial management",
      "Personalized ministry tools"
    ],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  },
  {
    title: "Custom Mobile Applications",
    description: "Develop a unique mobile experience that connects your congregation on-the-go, tailored to your church's needs.",
    icon: Smartphone,
    details: [
      "Native iOS and Android development",
      "Push notifications for events",
      "Mobile prayer requests",
      "Digital bible study tools",
      "Mobile giving integration",
      "Community features"
    ],
    image: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?q=80&w=3270&auto=format&fit=crop"
  }
]

const technologies = [
  {
    name: "React & Next.js",
    description: "Modern web framework for fast, interactive experiences",
    icon: Code,
    color: "from-[#40B5E5]/20 to-[#7DD3F7]/20"
  },
  {
    name: "React Native",
    description: "Native mobile app development for iOS and Android",
    icon: Smartphone,
    color: "from-[#40B5E5]/20 to-[#7DD3F7]/20"
  },
  {
    name: "Cloud Infrastructure",
    description: "Scalable, reliable hosting and deployment",
    icon: Server,
    color: "from-[#40B5E5]/20 to-[#7DD3F7]/20"
  },
  {
    name: "Security First",
    description: "Enterprise-grade security and data protection",
    icon: Shield,
    color: "from-[#40B5E5]/20 to-[#7DD3F7]/20"
  }
]

const portfolioItems = [
  {
    title: "Modern Church Website",
    description: "Responsive website with integrated live streaming and donations",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  },
  {
    title: "Church Mobile App",
    description: "Custom mobile app with event management and push notifications",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2340&auto=format&fit=crop"
  },
  {
    title: "Community Platform",
    description: "Integrated web and mobile platform for church community",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2340&auto=format&fit=crop"
  }
]

// Add animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Add these new animation variants
const slideInFromLeft = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
}

const slideInFromRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
}

const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.6 } }
}

// Add this at the top of the file after imports
const imageLoader = ({ src, width, quality = 75 }: { src: string; width: number; quality?: number }) => {
  return `${src}?w=${width}&q=${quality}&auto=format`
}

// Add this after the existing imports
const stats = [
  { label: 'Active Users', value: '50+', suffix: ' Churches' },
  { label: 'Years Experience', value: '10+', suffix: ' Years' },
  { label: 'Success Rate', value: '99', suffix: '%' },
]

const solutions = [
  {
    title: "Tailored Member Management Systems",
    description: "Custom-built solutions to efficiently manage your congregation's unique needs and preferences.",
    icon: Users
  },
  {
    title: "Bespoke Event & Service Planning Tools",
    description: "Personalized planning systems designed around your church's specific events and services.",
    icon: Layout
  },
  {
    title: "Custom Analytics & Reporting Dashboards",
    description: "Tailor-made dashboards providing insights that matter most to your ministry's growth and impact.",
    icon: Gauge
  },
  {
    title: "Integrated Communication Platforms",
    description: "Custom-developed systems to foster community engagement aligned with your church's communication style.",
    icon: MessageCircle
  },
  {
    title: "Customized Financial Management Solutions",
    description: "Bespoke financial tools designed to handle your church's specific tithing and donation processes.",
    icon: Server
  },
  {
    title: "Custom Mobile Applications",
    description: "Develop a unique mobile experience that connects your congregation on-the-go, tailored to your church's needs.",
    icon: Smartphone
  }
]

export default function DigitalServicesPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <Header />
      
      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[#FAFAFA]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#40B5E5]/20 to-[#7DD3F7]/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#7DD3F7]/20 to-[#40B5E5]/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
            
            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#40B5E510_1px,transparent_1px),linear-gradient(to_bottom,#40B5E510_1px,transparent_1px)] bg-[size:14px_14px]" />
            
            {/* Decorative Circles */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] opacity-20" />
            <div className="absolute top-3/4 right-1/4 w-6 h-6 rounded-full bg-gradient-to-r from-[#7DD3F7] to-[#40B5E5] opacity-30" />
            <div className="absolute top-1/2 left-3/4 w-3 h-3 rounded-full bg-[#40B5E5] opacity-20" />
          </div>

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Content */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
              >
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 bg-white pl-2 pr-4 py-2 rounded-full shadow-md mb-6">
                  <div className="bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] rounded-full p-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] bg-clip-text text-transparent">
                    Digital Solutions
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                  Elevate Your Church's
                  <span className="relative ml-3">
                    Digital Presence
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                  Empower your ministry with cutting-edge web solutions tailored for the modern church.
                  We create digital experiences that connect and engage your congregation.
                </p>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#40B5E5]/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#40B5E5]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">50+</div>
                      <div className="text-sm text-gray-600">Churches Served</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#40B5E5]/10 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-[#40B5E5]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">99%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#40B5E5]/10 rounded-lg flex items-center justify-center">
                      <Code className="w-6 h-6 text-[#40B5E5]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">10+</div>
                      <div className="text-sm text-gray-600">Years Experience</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-8 py-4 bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] text-white rounded-xl 
                             font-medium shadow-lg shadow-[#40B5E5]/20 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center justify-center">
                      Start Your Project
                      <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-medium border border-gray-200
                             hover:border-[#40B5E5] hover:bg-[#40B5E5]/5 transition-all duration-300 shadow-md"
                  >
                    <span className="relative flex items-center justify-center">
                      Explore Features
                      <ChevronRight className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                    </span>
                  </motion.button>
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-8 bottom-1/4">
                  <motion.div
                    animate={floatingAnimation}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#40B5E5]"></div>
                    <span className="text-sm font-medium text-gray-600">24/7 Support</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Content - Feature Showcase */}
              <div className="relative lg:ml-12 hidden lg:block">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: selectedFeature === index ? 1 : 0,
                        scale: selectedFeature === index ? 1 : 0.95
                      }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                      style={{ display: selectedFeature === index ? 'block' : 'none' }}
                    >
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover brightness-[0.7]"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                            <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                        </div>
                        <p className="text-white/90 text-lg">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Feature Navigation Dots */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-3">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedFeature(index)}
                        className={`w-2 h-8 rounded-full transition-all duration-300 ${
                          index === selectedFeature 
                            ? 'bg-gradient-to-r from-[#40B5E5] to-[#7DD3F7] scale-100' 
                            : 'bg-white/50 scale-75 hover:scale-90 hover:bg-white/70'
                        }`}
                        aria-label={`Go to feature ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimation type="fade-up">
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center space-x-2 mb-4">
                  <div className="p-2 bg-[#40B5E5]/10 rounded-lg">
                    <Layout className="w-4 h-4 text-[#40B5E5]" />
                  </div>
                  <span className="text-[#40B5E5] font-medium">Our Features</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Comprehensive Digital
                  <span className="relative mx-3">
                    Solutions
                    <svg aria-hidden="true" viewBox="0 0 418 42" className="absolute left-0 top-2/3 h-[0.58em] w-full fill-[#40B5E5]/20" preserveAspectRatio="none">
                      <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
                    </svg>
                  </span>
                </h2>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <ScrollAnimation
                  key={feature.title}
                  type="fade-up"
                  delay={0.1 * index}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:border-blue-200 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                            <feature.icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{feature.description}</p>
                      <ul className="space-y-3">
                        {feature.details.map((detail) => (
                          <li key={detail} className="flex items-start space-x-3 text-gray-600">
                            <ChevronRight className="w-5 h-5 text-[#40B5E5] flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section - Replacing Technologies Section */}
        <section className="py-24 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-t from-blue-50/50 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center space-x-2 mb-4">
                  <div className="p-2 bg-[#40B5E5]/10 rounded-lg">
                    <Code className="w-5 h-5 text-[#40B5E5]" />
                  </div>
                  <span className="text-[#40B5E5] font-medium">Our Solutions</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Custom Software Solutions for Your
                  <span className="relative mx-3">
                    Ministry
                    <svg aria-hidden="true" viewBox="0 0 418 42" className="absolute left-0 top-2/3 h-[0.58em] w-full fill-[#40B5E5]/20" preserveAspectRatio="none">
                      <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
                    </svg>
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-16">
                  We develop tailored software solutions to streamline your church's operations 
                  and enhance congregation engagement with modern, intuitive tools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solutions.map((solution, index) => (
                  <ScrollAnimation
                    key={solution.title}
                    type="fade-up"
                    delay={0.1 * index}
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl 
                                border border-gray-100 hover:border-[#40B5E5]/50 transition-all duration-300"
                    >
                      {/* Background Gradient */}
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br 
                                    from-[#40B5E5]/20 to-[#7DD3F7]/20 rounded-full blur-2xl opacity-50 
                                    group-hover:opacity-70 transition-opacity duration-300" />

                      <div className="relative">
                        {/* Icon Container */}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#40B5E5]/10 to-[#7DD3F7]/10 
                                      rounded-xl flex items-center justify-center mb-6 
                                      group-hover:scale-110 transition-transform duration-300">
                          <solution.icon className="w-7 h-7 text-[#40B5E5]" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#40B5E5] transition-colors">
                          {solution.title}
                        </h3>
                        <p className="text-gray-600">
                          {solution.description}
                        </p>

                        {/* Hover Indicator */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#40B5E5] 
                                      group-hover:w-full transition-all duration-300 opacity-0 
                                      group-hover:opacity-100" />
                      </div>
                    </motion.div>
                  </ScrollAnimation>
                ))}
              </div>

              {/* CTA Section */}
              <div className="mt-16 text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center px-8 py-4 bg-[#0F172A] text-white rounded-xl 
                           font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
                           transition-all duration-300"
                >
                  Schedule Your Expert Consultation
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <div id="quote">
          <QuoteSection />
        </div>
      </main>

      <Footer />
    </div>
  )
} 