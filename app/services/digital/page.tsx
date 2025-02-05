'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { Globe, Smartphone, Code, Gauge, Layout, Users, Server, Shield, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import ScrollAnimation from '../../../components/ui/scroll-animation'
import QuoteSection from '../../../components/QuoteSection'
import { motion, useAnimation, type AnimationControls } from 'framer-motion'
import { LazyMotion, domAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const features = [
  {
    title: "Custom Website Development",
    description: "Beautiful, responsive websites tailored to your church's unique needs",
    icon: Globe,
    details: [
      "Modern, mobile-first design",
      "Custom content management system",
      "Event management integration",
      "Online giving platform",
      "Sermon archives",
      "Prayer request system"
    ]
  },
  {
    title: "Mobile App Development",
    description: "Native iOS and Android apps that keep your congregation connected",
    icon: Smartphone,
    details: [
      "Cross-platform compatibility",
      "Push notifications",
      "Live streaming integration",
      "Community features",
      "Event calendar",
      "Digital bible study tools"
    ]
  },
  {
    title: "Performance Optimization",
    description: "Lightning-fast loading speeds and smooth user experience",
    icon: Gauge,
    details: [
      "Speed optimization",
      "SEO best practices",
      "Analytics integration",
      "Performance monitoring",
      "Caching solutions",
      "CDN implementation"
    ]
  },
  {
    title: "User Experience Design",
    description: "Intuitive interfaces that make navigation effortless",
    icon: Layout,
    details: [
      "User-centered design",
      "Accessibility compliance",
      "Responsive layouts",
      "Interactive elements",
      "Visual hierarchy",
      "Intuitive navigation"
    ]
  }
]

const technologies = [
  {
    name: "React & Next.js",
    description: "Modern web framework for fast, interactive experiences",
    icon: Code
  },
  {
    name: "React Native",
    description: "Native mobile app development for iOS and Android",
    icon: Smartphone
  },
  {
    name: "Cloud Infrastructure",
    description: "Scalable, reliable hosting and deployment",
    icon: Server
  },
  {
    name: "Security First",
    description: "Enterprise-grade security and data protection",
    icon: Shield
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

export default function DigitalServicesPage() {
  const [selectedTab, setSelectedTab] = useState('websites')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Update mobile menu to prevent body scroll when open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  // Add intersection observer for animations with proper typing
  const controls: AnimationControls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    if (inView) {
      controls.start('animate')
    }
  }, [controls, inView])

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section - Modernized */}
        <section className="relative min-h-[90vh] flex items-center py-12 sm:py-20 overflow-hidden overscroll-none">
          {/* Modern Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[#FAFAFA]"></div>
            <motion.div 
              className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#1E3A8A]/5 to-transparent"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2 }}
            />
            <motion.div 
              className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-100/50 to-transparent"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
            />
            
            {/* Modern Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          </div>

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
              {/* Left Content */}
              <motion.div className="relative z-10">
                {/* Modern Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 bg-white pl-2 pr-4 py-2 rounded-full shadow-md mb-6 sm:mb-8"
                >
                  <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] rounded-full p-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent">
                    Modern Digital Solutions
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.div>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6 sm:mb-8">
                    Transform Your
                    <div className="mt-2 relative inline-flex flex-col">
                      <span className="bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent">
                        Digital Presence
                      </span>
                      <motion.div 
                        className="absolute -bottom-2 left-0 w-full h-1 bg-[#1E3A8A]"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                      />
                    </div>
                  </h1>
                </motion.div>

                {/* Description */}
                <motion.p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed max-w-xl">
                  Create meaningful connections with your congregation through beautiful websites
                  and engaging mobile apps. We build digital solutions that bring your community together.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-8 py-4 bg-[#0F172A] text-white rounded-xl 
                             font-medium shadow-lg shadow-[#1E3A8A]/20 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center">
                      Start Your Project
                      <ChevronRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-medium border border-gray-200
                             hover:border-[#1E3A8A]/20 hover:bg-blue-50/50 transition-all duration-300 shadow-md"
                  >
                    <span className="relative flex items-center">
                      View Our Work
                      <ChevronRight className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </span>
                  </motion.button>
                </motion.div>

                {/* Stats Section */}
                <motion.div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    { number: "50+", label: "Churches" },
                    { number: "100+", label: "Projects" },
                    { number: "99%", label: "Satisfaction" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="text-3xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent"
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Content - Image Section */}
              <motion.div className="relative lg:ml-12 hidden sm:block">
                {/* Main Image Grid */}
                <div className="relative grid grid-cols-12 grid-rows-6 gap-4 h-[600px]">
                  {/* Large Main Image */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="col-span-8 row-span-6 relative rounded-3xl overflow-hidden shadow-2xl"
                  >
                    {/* Modern Frame */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-500/5 backdrop-blur-sm z-10"></div>
                    <div className="absolute inset-0 border border-white/10 rounded-3xl z-20"></div>
                    
                    <Image
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                      alt="Digital Services"
                      fill
                      loader={imageLoader}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      loading="eager"
                      priority={true}
                    />
                    
                    {/* Modern Overlay with Blur */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent"></div>
                    
                    {/* Always Visible Blurred Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-3xl rounded-full w-32 h-32 -translate-x-1/2 -translate-y-1/2"></div>
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Globe className="w-16 h-16 text-white/90 relative z-10 transform -translate-y-4" />
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Content Overlay */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="absolute bottom-0 left-0 right-0 p-8 z-30"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <motion.div 
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-[#1E3A8A] rounded-full"
                        />
                        <span className="text-white/90 text-sm font-medium">Modern Web Solutions</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Beautiful & Functional</h3>
                      <p className="text-white/80">Websites that make an impact</p>
                    </motion.div>
                  </motion.div>

                  {/* Top Right Image */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="col-span-4 row-span-3 relative rounded-3xl overflow-hidden shadow-xl"
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2340&auto=format&fit=crop"
                      alt="Mobile Development"
                      fill
                      loader={imageLoader}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      loading="eager"
                      priority={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-800/90 via-blue-800/30 to-transparent"></div>
                    
                    {/* Always Visible Blurred Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-3xl rounded-full w-24 h-24 -translate-x-1/2 -translate-y-1/2"></div>
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Smartphone className="w-12 h-12 text-white/90 relative z-10 transform -translate-y-4" />
                        </motion.div>
                      </motion.div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="text-lg font-semibold text-white">Mobile Apps</h4>
                      <p className="text-white/80 text-sm">Cross-platform solutions</p>
                    </div>
                  </motion.div>

                  {/* Bottom Right Image */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="col-span-4 row-span-3 relative rounded-3xl overflow-hidden shadow-xl"
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2340&auto=format&fit=crop"
                      alt="Analytics Dashboard"
                      fill
                      loader={imageLoader}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      loading="eager"
                      priority={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent"></div>
                    
                    {/* Always Visible Blurred Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-3xl rounded-full w-24 h-24 -translate-x-1/2 -translate-y-1/2"></div>
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Gauge className="w-12 h-12 text-white/90 relative z-10 transform -translate-y-4" />
                        </motion.div>
                      </motion.div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="text-lg font-semibold text-white">Analytics</h4>
                      <p className="text-white/80 text-sm">Data-driven insights</p>
                    </div>
                  </motion.div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{
                    y: [-10, 10, -10],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -right-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <Code className="w-6 h-6 text-[#1E3A8A]" />
                </motion.div>

                <motion.div 
                  animate={{
                    y: [10, -10, 10],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -left-8 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <Smartphone className="w-6 h-6 text-[#1E3A8A]" />
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#1E3A8A]/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#1E3A8A]/5 rounded-full blur-3xl"></div>

                {/* Additional Decorative Elements */}
                <motion.div 
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -right-4 bottom-1/3 w-20 h-20 border-2 border-dashed border-blue-200 rounded-full"
                />
                
                <motion.div 
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -left-4 top-1/3 w-16 h-16 bg-gradient-to-r from-blue-500/10 to-blue-400/10 rounded-lg blur-lg"
                />

                {/* Tech Badges */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -right-2 top-1/2 transform translate-x-1/2 space-y-4"
                >
                  {['React', 'Next.js', 'TailwindCSS'].map((tech, index) => (
                    <div 
                      key={tech}
                      className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200/50 text-sm font-medium text-gray-600"
                    >
                      {tech}
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Mobile-only image */}
              <motion.div 
                variants={slideInFromRight}
                initial="initial"
                animate="animate"
                className="relative sm:hidden"
              >
                <div className="relative h-[300px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                    alt="Digital Services"
                    fill
                    loader={imageLoader}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="eager"
                    priority={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent"></div>
                  
                  {/* Mobile Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-[#1E3A8A]/20 blur-3xl rounded-full w-24 h-24 -translate-x-1/2 -translate-y-1/2"></div>
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Globe className="w-12 h-12 text-white/90 relative z-10 transform -translate-y-4" />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="py-20 sm:py-32 bg-white relative">
          <LazyMotion features={domAnimation}>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
              <ScrollAnimation type="fade-up">
                <div className="text-center mb-12 sm:mb-20">
                  <div className="inline-flex items-center rounded-full border border-[#1E3A8A]/20 bg-gradient-to-r from-[#1E3A8A]/10 to-[#1E3A8A]/10 px-4 py-1.5 text-sm text-[#1E3A8A] mb-8 backdrop-blur-sm">
                    <Code className="w-4 h-4 mr-2" />
                    <span className="font-medium">Our Services</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
                    Comprehensive
                    <span className="relative mx-4">
                      <span className="relative z-10 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent">Digital</span>
                      <span className="absolute -bottom-1.5 left-0 w-full h-1.5 bg-gradient-to-r from-[#1E3A8A]/40 to-[#1E3A8A]/40 blur-sm"></span>
                      <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A]"></span>
                    </span>
                    Solutions
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                    From custom websites to mobile apps, we provide end-to-end digital solutions
                    that help churches connect with their congregation in meaningful ways.
                  </p>
                </div>
              </ScrollAnimation>

              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {features.map((feature, index) => (
                  <ScrollAnimation 
                    key={feature.title}
                    type="fade-up"
                    delay={0.2 * index}
                  >
                    <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 sm:p-8 border border-gray-100
                                  hover:border-[#1E3A8A]/20 transition-all duration-500 overflow-hidden">
                      {/* Hover Effect Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative flex flex-col sm:flex-row items-start gap-6">
                        <div className="flex-shrink-0 relative mb-4 sm:mb-0">
                          <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center
                                      transform group-hover:scale-110 transition-transform duration-500">
                            <feature.icon className="w-8 h-8 text-white" />
                          </div>
                          {/* Decorative dot */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                        </div>

                        <div className="flex-grow">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                          <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                          <ul className="space-y-3">
                            {feature.details.map((detail) => (
                              <li key={detail} className="flex items-center text-gray-600 group/item">
                                <div className="mr-3 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center
                                            group-hover/item:bg-blue-100 transition-colors duration-300">
                                  <ChevronRight className="w-4 h-4 text-[#1E3A8A] group-hover/item:translate-x-0.5 transition-transform" />
                                </div>
                                <span className="group-hover/item:text-gray-900 transition-colors">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimation>
                ))}
              </div>
            </div>
          </LazyMotion>
        </section>

        {/* Portfolio Section - Enhanced */}
        <section id="portfolio" className="py-20 sm:py-32 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-t from-blue-50/50 to-transparent"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollAnimation type="fade-up">
              <div className="text-center mb-20">
                <div className="inline-flex items-center rounded-full border border-[#1E3A8A]/20 bg-gradient-to-r from-[#1E3A8A]/10 to-[#1E3A8A]/10 px-4 py-1.5 text-sm text-[#1E3A8A] mb-8 backdrop-blur-sm">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="font-medium">Portfolio</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
                  Our
                  <span className="relative mx-4">
                    <span className="relative z-10 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent">Recent</span>
                    <span className="absolute -bottom-1.5 left-0 w-full h-1.5 bg-gradient-to-r from-[#1E3A8A]/40 to-[#1E3A8A]/40 blur-sm"></span>
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A]"></span>
                  </span>
                  Work
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Take a look at some of our recent projects and see how we've helped churches
                  enhance their digital presence.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {portfolioItems.map((item, index) => (
                <ScrollAnimation
                  key={item.title}
                  type="fade-up"
                  delay={0.2 * index}
                >
                  <div className="group relative rounded-3xl overflow-hidden bg-white border border-gray-200
                                hover:border-[#1E3A8A]/20 hover:shadow-xl transition-all duration-500">
                    {/* Image Container */}
                    <div className="aspect-w-16 aspect-h-12 relative overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        loader={imageLoader}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                        loading="eager"
                        priority={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent 
                                    opacity-90 group-hover:opacity-75 transition-opacity duration-500"></div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-2 h-2 bg-[#1E3A8A] rounded-full"></div>
                          <span className="text-[#1E3A8A] text-sm">Featured Project</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 transform group-hover:translate-y-0 transition-transform duration-500">{item.title}</h3>
                      <p className="text-gray-200 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">{item.description}</p>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Technologies Section - Enhanced */}
        <section className="py-20 sm:py-32 bg-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-1/2 bg-gradient-to-t from-blue-50/50 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <ScrollAnimation type="fade-up">
              <div className="text-center mb-20">
                <div className="inline-flex items-center rounded-full border border-[#1E3A8A]/20 bg-gradient-to-r from-[#1E3A8A]/10 to-[#1E3A8A]/10 px-4 py-1.5 text-sm text-[#1E3A8A] mb-8 backdrop-blur-sm">
                  <Server className="w-4 h-4 mr-2" />
                  <span className="font-medium">Technology</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
                  Built with
                  <span className="relative mx-4">
                    <span className="relative z-10 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] bg-clip-text text-transparent">Modern</span>
                    <span className="absolute -bottom-1.5 left-0 w-full h-1.5 bg-gradient-to-r from-[#1E3A8A]/40 to-[#1E3A8A]/40 blur-sm"></span>
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A]"></span>
                  </span>
                  Technology
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  We use the latest technologies to build fast, secure, and scalable digital solutions.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {technologies.map((tech, index) => (
                <ScrollAnimation
                  key={tech.name}
                  type="fade-up"
                  delay={0.2 * index}
                >
                  <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100
                                hover:border-[#1E3A8A]/20 transition-all duration-500 text-center overflow-hidden">
                    {/* Hover Effect Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-[#1E3A8A] rounded-2xl transform -rotate-6 group-hover:-rotate-12 transition-transform duration-500 opacity-75"></div>
                        <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                          <tech.icon className="w-10 h-10 text-[#1E3A8A]" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{tech.name}</h3>
                      <p className="text-gray-600">{tech.description}</p>
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Quote Section and Footer with dark background */}
      <div className="bg-[#0F172A] pt-12 sm:pt-0">
        <div id="quote">
          <QuoteSection />
        </div>
        <Footer />
      </div>
    </div>
  )
} 