'use client'

import { useState } from 'react'
import { Music2, Mail, Users, MessageSquare } from 'lucide-react'

export default function QuoteSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [churchName, setChurchName] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus('submitting')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          churchName,
          message
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setSubmitStatus('success')
      setName('')
      setEmail('')
      setChurchName('')
      setMessage('')
    } catch (error) {
      console.error('Error:', error)
      setSubmitStatus('error')
    }
  }

  return (
    <section id="quote" className="py-24 bg-white">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-blue-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-indigo-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Music2 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-blue-600 font-medium">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-[2.75rem] font-bold text-gray-900 mb-4 tracking-tight leading-tight">
              Ready to Transform Your Church's<br />Audio Experience?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let's discuss how we can help enhance your worship services with professional audio solutions.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      required
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 
                               focus:border-blue-500/40 transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      required
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 
                               focus:border-blue-500/40 transition-all duration-200"
                      placeholder="john@church.com"
                    />
                  </div>
                </div>

                {/* Church Name */}
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Church Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Music2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      required
                      type="text"
                      name="church"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 
                               focus:border-blue-500/40 transition-all duration-200"
                      placeholder="Your Church Name"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tell us about your needs</label>
                  <div className="relative">
                    <div className="absolute top-3 left-4">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      required
                      name="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 
                               focus:border-blue-500/40 transition-all duration-200 resize-none"
                      placeholder="Tell us about your current setup and what you're looking to achieve..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col items-center justify-center pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-8 py-3 bg-[#0F172A] text-white 
                           rounded-xl font-medium min-w-[200px] hover:bg-[#1E293B] transform hover:-translate-y-0.5 
                           hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none 
                           disabled:shadow-none transition-all duration-200"
                >
                  {isSubmitting ? 'Sending...' : 'Schedule a Consultation'}
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <p className="text-green-600 font-medium">
                    Message sent successfully! We'll be in touch soon.
                  </p>
                )}
                {submitStatus === 'error' && (
                  <p className="text-red-600 font-medium">
                    Failed to send message. Please try again or contact us directly.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
} 