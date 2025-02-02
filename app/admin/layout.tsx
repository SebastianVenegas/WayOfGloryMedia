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
import { useSidebar } from '@/contexts/SidebarContext'

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
  const { isExpanded, toggleSidebar } = useSidebar()
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
        animate={{
          width: isExpanded ? '280px' : '80px',
          transition: { duration: 0.3 }
        }}
        className="fixed left-0 top-0 bottom-0 z-[50] bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600">
              <Music className="h-5 w-5 text-white" />
            </div>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-gray-900"
              >
                Way of Glory
              </motion.span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-gray-100 rounded-lg"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-none">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "relative z-10 p-1.5 rounded-lg transition-colors duration-200",
                  isActive ? `${item.color} bg-white shadow-sm` : "text-gray-400 group-hover:text-gray-500"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                {!isExpanded && (
                  <div className="fixed left-[70px] px-2.5 py-1.5 bg-gray-900 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.name}
                  </div>
                )}
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-gray-200 bg-gray-50/80">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors",
            isExpanded && "cursor-pointer"
          )}>
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
              W
            </div>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-900 truncate">Staff Account</p>
                <p className="text-xs text-gray-500 truncate">staff@wayofglory.com</p>
              </motion.div>
            )}
          </div>
          {isExpanded && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 justify-start gap-2 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="fixed top-0 left-[5px] right-0 bottom-0 overflow-auto bg-gray-50/50">
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  )
} 