'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store user data in localStorage
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_email', data.email)
      localStorage.setItem('admin_name', data.name)

      // Dispatch auth state change event
      window.dispatchEvent(new Event('authStateChange'))

      // Show success message
      toast.success('Logged in successfully')

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Decorative (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10" />
          {/* Geometric Shapes */}
          <div className="absolute inset-0">
            {/* Rotating squares */}
            <div className="absolute top-12 right-12 w-24 h-24 border border-blue-400/20 rounded-xl animate-[spin_10s_linear_infinite]" />
            <div className="absolute top-16 right-16 w-24 h-24 border border-blue-400/20 rounded-xl animate-[spin_15s_linear_infinite_reverse]" />
            
            {/* Floating circles */}
            <div className="absolute bottom-[20%] left-[10%] w-32 h-32 border-2 border-blue-400/20 rounded-full animate-[bounce_8s_ease-in-out_infinite]" 
                 style={{ animation: 'float 8s ease-in-out infinite' }} />
            <div className="absolute bottom-[18%] left-[8%] w-32 h-32 border border-blue-400/10 rounded-full animate-[bounce_6s_ease-in-out_infinite]"
                 style={{ animation: 'float 6s ease-in-out infinite' }} />
            
            {/* Pulsing circle */}
            <div className="absolute top-[20%] left-[5%] w-48 h-48 border border-blue-400/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
            
            {/* Rotating square with scale */}
            <div className="absolute top-[30%] right-[10%] w-20 h-20 border border-blue-400/20 rotate-45 animate-[spin_20s_linear_infinite]" 
                 style={{ transformOrigin: 'center' }} />
            
            {/* Floating square */}
            <div className="absolute bottom-[10%] right-[20%] w-16 h-16 border-2 border-blue-400/20 animate-[bounce_7s_ease-in-out_infinite]"
                 style={{ animation: 'float 7s ease-in-out infinite' }} />
          </div>

          {/* Add keyframes for float animation */}
          <style jsx>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(0) rotate(0deg);
              }
              50% {
                transform: translateY(-20px) rotate(5deg);
              }
            }
          `}</style>

          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col h-full text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo/Icon/Logo icon.png"
                  alt="Way of Glory Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-3xl font-bold tracking-tight">Way of Glory</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-auto max-w-md"
          >
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Employee Portal
            </h2>
            <p className="text-blue-50 text-lg leading-relaxed">
              Secure access for Way of Glory team members. Manage inventory, process orders, and help our customers achieve excellence in worship.
            </p>
          </motion.div>

          {/* Enhanced Decorative Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-blue-400/10 blur-3xl animate-pulse" 
                 style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[10%] right-[5%] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse" 
                 style={{ animationDuration: '10s' }} />
            <div className="absolute top-[40%] right-[20%] w-48 h-48 rounded-full bg-blue-600/10 blur-2xl animate-pulse" 
                 style={{ animationDuration: '6s' }} />
            {/* Floating Dots */}
            <div className="absolute inset-0 mix-blend-overlay opacity-30">
              <div className="absolute h-2 w-2 rounded-full bg-blue-400 top-[15%] left-[15%] animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute h-2 w-2 rounded-full bg-blue-400 top-[45%] left-[35%] animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute h-2 w-2 rounded-full bg-blue-400 top-[25%] right-[25%] animate-pulse" style={{ animationDuration: '5s' }} />
              <div className="absolute h-2 w-2 rounded-full bg-blue-400 bottom-[20%] right-[15%] animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute h-2 w-2 rounded-full bg-blue-400 bottom-[30%] left-[25%] animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center min-h-screen bg-white px-6 py-12 md:p-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[360px] mx-auto relative"
        >
          {/* Mobile Logo */}
          <div className="text-center md:hidden">
            <div className="flex flex-col items-center">
              <div className="relative w-[140px] h-[28px] mb-16">
                <Image
                  src="/images/logo/LogoLight.png"
                  alt="Way of Glory"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="space-y-2 mb-10">
                <h2 className="text-[20px] font-semibold text-gray-900">
                  Employee Portal
                </h2>
                <p className="text-[14px] text-gray-500">
                  Secure access for Way of Glory team members
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Title (Hidden on Mobile) */}
          <div className="hidden md:block space-y-2 text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900">
              Employee Portal
            </h2>
            <p className="text-base text-gray-500">
              Secure access for Way of Glory team members
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedInput === 'email' ? 'text-blue-500' : 'text-gray-400'
                }`}>
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className="h-[52px] pl-11 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 text-[15px]"
                  placeholder="Enter your email"
                />
              </div>

              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedInput === 'password' ? 'text-blue-500' : 'text-gray-400'
                }`}>
                  <Lock className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className="h-[52px] pl-11 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 text-[15px]"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-[52px] bg-[#2563EB] hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 mt-2 text-[15px]"
              disabled={isLoading}
            >
              <div className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </div>
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
} 