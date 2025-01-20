'use client'

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { PhoneCall } from "lucide-react";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Sound", "Video"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="Church worship background"
          fill
          className="object-cover brightness-[0.3]"
          priority
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-sm mb-8">
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Southern California's Trusted Church Audio Partner
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Transform Your<br />
            Worship Experience<br />
            with Crystal Clear{" "}
            <span className="relative inline-flex w-32 justify-center overflow-hidden">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-white/80 max-w-2xl mb-8">
            Empowering Southern California churches with professional sound and streaming solutions. From intimate gatherings to full congregations, we help you create an immersive worship experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold bg-white text-brand-blue hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Schedule Free Consultation
            </Link>
            <Link 
              href="tel:(714)765-4321"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
            >
              <PhoneCall className="w-5 h-5" />
              (714) 765-4321
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-16">
            <p className="text-sm text-white/60 mb-6 uppercase tracking-wider">
              TRUSTED BY LOCAL CHURCHES IN ORANGE COUNTY
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { name: "Calvary Chapel Costa Mesa", location: "Costa Mesa" },
                { name: "Saddleback Church", location: "Lake Forest" },
                { name: "Rock Harbor", location: "Costa Mesa" },
                { name: "Mariners Church", location: "Irvine" }
              ].map((church, index) => (
                <div
                  key={church.name}
                  className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white text-center"
                >
                  <p className="font-medium">{church.name}</p>
                  <p className="text-sm text-white/60">{church.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Hero }; 