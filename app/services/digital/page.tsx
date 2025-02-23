"use client"

import { useState, useEffect } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import {
  Globe,
  Smartphone,
  Code,
  Gauge,
  Layout,
  Users,
  Server,
  ChevronRight,
  Star,
  ArrowRight,
  MessageCircle,
} from "lucide-react"
import Image from "next/image"
import ScrollAnimation from "@/components/ui/scroll-animation"
import QuoteSection from "@/components/QuoteSection"
import { motion } from "framer-motion"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const images = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"
];

const features = [
  {
    title: "Modern Church Websites",
    description: "Beautiful, responsive websites with powerful features designed specifically for churches.",
    icon: Globe,
    image: "https://images.unsplash.com/photo-1600267185393-e158a98703de?q=80&w=2070&auto=format&fit=crop",
    details: [
      "Live service streaming integration",
      "Online giving & donation platform",
      "Sermon archive & media library",
      "Event registration & calendar",
      "Member portal & directory"
    ],
  },
  {
    title: "Digital Ministry Tools",
    description: "Comprehensive digital tools that help you manage and grow your ministry effectively.",
    icon: Smartphone,
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1974&auto=format&fit=crop",
    details: [
      "Prayer request management",
      "Small group coordination",
      "Volunteer scheduling",
      "Ministry team collaboration",
      "Attendance tracking"
    ],
  },
  {
    title: "Engagement Platform",
    description: "Keep your congregation connected and engaged with interactive features.",
    icon: Code,
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop",
    details: [
      "Mobile-friendly experience",
      "Social media integration",
      "Email & SMS notifications",
      "Community discussion boards",
      "Member engagement analytics"
    ],
  },
]

const solutions = [
  {
    title: "Tailored Member Management Systems",
    description: "Custom-built solutions to efficiently manage your congregation's unique needs and preferences.",
    icon: Users,
  },
  {
    title: "Bespoke Event & Service Planning Tools",
    description: "Personalized planning systems designed around your church's specific events and services.",
    icon: Layout,
  },
  {
    title: "Custom Analytics & Reporting Dashboards",
    description: "Tailor-made dashboards providing insights that matter most to your ministry's growth and impact.",
    icon: Gauge,
  },
  {
    title: "Integrated Communication Platforms",
    description:
      "Custom-developed systems to foster community engagement aligned with your church's communication style.",
    icon: MessageCircle,
  },
  {
    title: "Customized Financial Management Solutions",
    description: "Bespoke financial tools designed to handle your church's specific tithing and donation processes.",
    icon: Server,
  },
  {
    title: "Custom Mobile Applications",
    description:
      "Develop a unique mobile experience that connects your congregation on-the-go, tailored to your church's needs.",
    icon: Smartphone,
  },
]

export default function DigitalServicesPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(imageInterval)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0A0F1C] to-[#1A2035] overflow-x-hidden">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center pt-20">
          <div className="absolute inset-0">
            <Image
              src={images[0]}
              alt="Modern church website design across multiple devices"
              fill
              className="object-cover object-center brightness-125 scale-105 transform-gpu hover:scale-[1.06] transition-transform duration-700"
              sizes="100vw"
              quality={100}
              priority
              style={{ objectPosition: '50% 40%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1C]/80 via-[#0A0F1C]/70 to-[#0A0F1C]/60" />
            <div className="absolute inset-0 bg-[#0A0F1C]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/30 to-transparent" />
          </div>

          <div className="container relative mx-auto px-6 lg:px-8">
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center gap-2 bg-blue-600/20 backdrop-blur-xl pl-2 pr-3 py-1.5 rounded-full border border-blue-400/30">
                  <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center backdrop-blur-xl">
                    <Globe className="w-3 h-3 text-blue-300" />
                  </div>
                  <span className="text-sm font-medium text-blue-100">Professional Church Websites</span>
                </div>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] drop-shadow-lg mb-8">
                Elevate Your{' '}
                <br className="hidden lg:block" />
                Ministry's{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 inline-block">
                  Digital Experience
                </span>
              </h1>

              <p className="text-lg text-blue-100 max-w-2xl leading-relaxed mb-10 drop-shadow-lg">
                Build a powerful church website with live streaming, online giving, event registration, 
                and member engagement tools. Our complete digital solution helps you reach and connect 
                with your congregation 24/7.
              </p>

              <div className="grid grid-cols-3 gap-8 py-10">
                {[
                  { icon: Users, value: "1000+", label: "Active Members Engaged" },
                  { icon: Star, value: "100%", label: "Uptime Guarantee" },
                  { icon: Code, value: "15+", label: "Website Features" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="flex items-center gap-4"
                  >
                    <div className="p-3 bg-blue-600/20 backdrop-blur-xl rounded-xl border border-blue-400/30">
                      <stat.icon className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                      <div className="text-sm text-blue-200 font-medium">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium 
                           transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25
                           hover:shadow-2xl hover:shadow-blue-500/40 border border-blue-400/30 backdrop-blur-xl"
                >
                  Start Your Project
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium 
                           transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-xl
                           border border-white/20 hover:border-white/30 hover:text-blue-200"
                >
                  View Solutions
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-4 right-4 bg-blue-600/20 backdrop-blur-xl px-5 py-2.5 rounded-xl
                       border border-blue-400/30 flex items-center gap-3 hover:bg-blue-600/30 
                       transition-all duration-300 cursor-pointer group"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-sm font-medium text-blue-100 group-hover:text-blue-200 transition-colors">24/7 Support</span>
            </motion.div>
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
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={feature.image || "/placeholder.svg"}
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

        {/* Solutions Section */}
        <section className="py-24 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-t from-blue-50/50 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-5xl mx-auto">
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
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br 
                                    from-[#40B5E5]/20 to-[#7DD3F7]/20 rounded-full blur-2xl opacity-50 
                                    group-hover:opacity-70 transition-opacity duration-300" />

                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#40B5E5]/10 to-[#7DD3F7]/10 
                                      rounded-xl flex items-center justify-center mb-6 
                                      group-hover:scale-110 transition-transform duration-300">
                          <solution.icon className="w-7 h-7 text-[#40B5E5]" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#40B5E5] transition-colors">
                          {solution.title}
                        </h3>
                        <p className="text-gray-600">
                          {solution.description}
                        </p>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#40B5E5] 
                                      group-hover:w-full transition-all duration-300 opacity-0 
                                      group-hover:opacity-100" />
                      </div>
                    </motion.div>
                  </ScrollAnimation>
                ))}
              </div>

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

