'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, Mail, Loader2 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // Check if we're in PWA mode
  const isPWA = searchParams.get('pwa') === 'true'

  useEffect(() => {
    // Check if we can install the PWA
    const checkInstallable = async () => {
      if ('getInstalledRelatedApps' in navigator) {
        const relatedApps = await (navigator as any).getInstalledRelatedApps()
        if (relatedApps.length === 0) {
          setShowInstallPrompt(true)
        }
      }
    }

    if (isPWA) {
      checkInstallable()
    }
  }, [isPWA])

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

      // If we're in PWA mode and need to install
      if (isPWA && showInstallPrompt) {
        toast({
          title: "Install Admin Dashboard",
          description: "Please add this page to your home screen for secure access.",
          duration: 5000,
        })
        return
      }

      // Otherwise redirect to products page
      router.push('/admin/products')
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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

        {showInstallPrompt && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Please add this page to your home screen after logging in for secure access.</p>
          </div>
        )}
      </div>
    </div>
  )
} 