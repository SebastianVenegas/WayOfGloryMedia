'use client'

export default function CallToAction() {
  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-16 bg-[#E6EEFF]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-[2.75rem] font-bold text-gray-900 mb-4">
          Ready to Transform Your Church's Audio Experience?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Let&apos;s transform your church&apos;s audio and digital experience
        </p>
        <button
          onClick={scrollToQuote}
          className="inline-flex items-center px-8 py-3 bg-[#B7D1FF] text-gray-900 
                   rounded-xl font-medium hover:bg-[#a3c4ff] transform hover:-translate-y-0.5 
                   transition-all duration-200"
        >
          Schedule a Consultation
        </button>
      </div>
    </section>
  )
}

