'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const churches = [
  {
    name: "Grace Community Church",
    description: "Complete audio system upgrade",
    image: "/images/church1.jpg"
  },
  {
    name: "Living Hope Fellowship",
    description: "Professional sound system design",
    image: "/images/church2.jpg"
  }
]

export default function ChurchShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % churches.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-[400px] overflow-hidden">
      {/* Images */}
      {churches.map((church, index) => (
        <div
          key={church.name}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={church.image}
            alt={church.name}
            fill
            className="object-cover object-center brightness-75"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold mb-6 drop-shadow-lg">
            Trusted by Churches Across Southern California
          </h2>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto drop-shadow-lg">
            Transforming worship experiences through professional audio solutions
          </p>
          <p className="text-base font-medium text-white/90 drop-shadow-lg">
            Trusted by over 50+ churches in Southern California
          </p>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3">
        {churches.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white scale-110' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
} 