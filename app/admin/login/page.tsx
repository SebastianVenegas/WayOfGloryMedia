'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, Mail, Loader2, Share2, ArrowUpRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPWAPrompt, setShowPWAPrompt] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        throw new Error('Login failed')
      }

      const data = await res.json()

      if (data.success) {
        // Show PWA installation prompt after successful login
        setShowPWAPrompt(true)
      } else {
        router.push('/admin/products')
      }
    } catch (error) {
      toast.error('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl shadow-lg space-y-8 border border-gray-100">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">World Of Glory</h1>
            <h2 className="text-2xl font-semibold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access the admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  type="email"
                  disabled={isLoading}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type="password"
                  disabled={isLoading}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg transition-colors font-medium text-lg shadow-md"
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>Protected by World Of Glory Admin</p>
          </div>
        </div>
      </div>

      <Dialog open={showPWAPrompt} onOpenChange={setShowPWAPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Admin Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">1</span>
                <p className="font-medium">Tap the Share button</p>
                <Share2 className="h-5 w-5" />
              </div>
              <p className="text-gray-600 pl-8">
                In Safari, tap the share button at the top of the screen
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">2</span>
                <p className="font-medium">Select "Add to Home Screen"</p>
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <p className="text-gray-600 pl-8">
                Scroll down and tap "Add to Home Screen" in the share menu
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">3</span>
                <p className="font-medium">Add the App</p>
              </div>
              <p className="text-gray-600 pl-8">
                Tap "Add" in the top right corner to install the admin dashboard
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowPWAPrompt(false)
                router.push('/admin/products')
              }}
            >
              Continue to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 