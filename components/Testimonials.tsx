import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Santi Sounds transformed our worship experience. The sound quality is exceptional, and their team's expertise made all the difference.",
    author: "Pastor Michael Thompson",
    role: "Lead Pastor",
    church: "Grace Community Church",
    avatar: "/images/testimonials/pastor-michael.jpg"
  },
  {
    quote: "Their attention to detail and understanding of worship spaces is unmatched. Our congregation immediately noticed the improvement.",
    author: "Sarah Martinez",
    role: "Worship Director",
    church: "Living Hope Fellowship",
    avatar: "/images/testimonials/sarah.jpg"
  },
  {
    quote: "Professional, reliable, and truly passionate about church audio. They didn't just install a system – they trained our team to excel.",
    author: "David Wilson",
    role: "Technical Director",
    church: "Cornerstone Chapel",
    avatar: "/images/testimonials/david.jpg"
  }
]

export default function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Quote className="w-4 h-4 text-brand-blue" />
            </div>
            <span className="text-brand-blue font-medium uppercase tracking-wider text-sm">Testimonials</span>
          </div>
          <h2 className="text-[2.75rem] font-bold text-gray-900 mb-4 tracking-tight">
            Trusted by Churches Across Southern California
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from the churches we've helped transform their worship experience through professional audio solutions.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.author}
              className="bg-white p-8 rounded-2xl shadow-sm"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-brand-blue/20 mb-6" />
              
              {/* Quote Text */}
              <blockquote className="text-gray-600 mb-8">
                "{testimonial.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-gray-600">{testimonial.church}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trusted by over 50+ churches in Southern California</p>
          <div className="flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i}
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


