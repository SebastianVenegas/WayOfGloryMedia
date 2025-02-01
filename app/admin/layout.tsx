'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  Package, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Users,
  ClipboardList,
  BarChart,
  Music,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutGrid,
    color: 'text-indigo-500'
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    color: 'text-blue-500'
  },
  {
    name: 'Services',
    href: '/admin/services',
    icon: Music,
    color: 'text-pink-500'
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
    color: 'text-green-500'
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    color: 'text-orange-500'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
    color: 'text-purple-500'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'text-gray-500'
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  // Check authentication on mount and pathname change
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (!response.ok) {
          setIsAuthenticated(false)
          localStorage.removeItem('isLoggedIn')
          if (pathname !== '/admin/login') {
            router.push('/admin/login')
          }
          return
        }
        
        setIsAuthenticated(true)
        localStorage.setItem('isLoggedIn', 'true')
        if (pathname === '/admin/login') {
          router.push('/admin')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        localStorage.removeItem('isLoggedIn')
        if (pathname !== '/admin/login') {
          router.push('/admin/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Check if we have a stored login state
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn && pathname !== '/admin/login') {
      router.push('/admin/login')
      return
    }

    checkAuth()
  }, [pathname, router])

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pathname !== '/admin/login') {
        localStorage.removeItem('isLoggedIn')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsAuthenticated(false)
      localStorage.removeItem('isLoggedIn')
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If on login page or not authenticated, don't show the sidebar
  if (pathname === '/admin/login' || !isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col bg-white border-r border-gray-200",
          "bg-gradient-to-b from-gray-50/50 to-white"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-end h-16 px-4 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors duration-200",
                  isActive ? `${item.color} bg-white shadow-sm` : "text-gray-400 group-hover:text-gray-500"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isCollapsed && (
                  <div className="fixed left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors",
            !isCollapsed && "cursor-pointer"
          )}>
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium">
              A
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@santisounds.com</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div 
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-[280px]"
        )}
      >
        {children}
      </div>
    </div>
  )
} 