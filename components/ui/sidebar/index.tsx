'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../button"
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutGrid, 
  Package, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Users,
  ClipboardList,
  BarChart,
  LogOut,
  Mic2,
  Menu,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSidebar } from '@/contexts/SidebarContext'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutGrid,
    color: 'text-blue-500'
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
    icon: Mic2,
    color: 'text-blue-500'
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
    color: 'text-blue-500'
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    color: 'text-blue-500'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
    color: 'text-blue-500'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'text-blue-500'
  }
]

interface SidebarProps {
  isExpanded: boolean
  toggleSidebar: () => void
  pathname: string
  handleLogout: () => void
  children?: React.ReactNode
  userEmail: string
  userName: string
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, toggleSidebar } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token')
      const email = localStorage.getItem('admin_email')
      const name = localStorage.getItem('admin_name')

      if (token && email && name) {
        setIsAuthenticated(true)
        setUserEmail(email)
        setUserName(name)
      } else {
        setIsAuthenticated(false)
        if (pathname !== '/admin/login') {
          window.location.href = '/admin/login'
        }
      }
    }

    checkAuth()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_token' || e.key === 'admin_email' || e.key === 'admin_name') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChange', checkAuth)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChange', checkAuth)
    }
  }, [router, pathname])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_email')
      localStorage.removeItem('admin_name')
      localStorage.removeItem('admin_token')
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      toast.success('Signed out successfully')
      setIsAuthenticated(false)
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <Sidebar
        isExpanded={isExpanded}
        toggleSidebar={toggleSidebar}
        pathname={pathname}
        handleLogout={handleLogout}
        userEmail={userEmail}
        userName={userName}
      />
      <div 
        className={cn(
          "absolute top-0 right-0 min-h-screen w-full transition-all duration-200",
          "md:w-[calc(100%-80px)] md:left-[80px]",
          isExpanded && "md:w-[calc(100%-280px)] md:left-[280px]",
          "pt-16 md:pt-0"
        )}
      >
        <div className="h-full w-full px-4 md:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ isExpanded, toggleSidebar, pathname, handleLogout, userEmail, userName }: SidebarProps & { userEmail: string, userName: string }) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavigation = (href: string) => {
    router.push(href)
    if (isMobile) {
      setTimeout(() => toggleSidebar(), 100)
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 flex items-center px-4 md:hidden z-[48]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-10 w-10 rounded-xl text-gray-500 hover:bg-gray-50"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 ml-3">
          <div className="w-14 h-14 relative p-1.5">
            <Image
              src="/images/logo/Icon/Logo icon.png"
              alt="Way of Glory Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold text-gray-900 text-lg tracking-tight">
            Way of Glory
          </span>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[49]"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <AnimatePresence mode="wait">
        {(isExpanded || !isMobile) && (
          <motion.div
            initial={isMobile ? { x: '-100%' } : false}
            animate={isMobile ? { x: 0 } : { width: isExpanded ? 280 : 80 }}
            exit={isMobile ? { x: '-100%' } : undefined}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className={cn(
              "fixed left-0 top-0 bottom-0 z-[50] bg-white flex flex-col shadow-xl",
              isMobile && "w-[85%] max-w-[360px]"
            )}
          >
            {/* Mobile Menu Header */}
            {isMobile && (
              <div className="relative h-32 bg-gradient-to-br from-blue-600 to-blue-700 px-6 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <Image
                      src="/images/logo/Icon/Logo icon.png"
                      alt="Way of Glory Logo"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white text-lg tracking-tight">
                      Way of Glory
                    </span>
                    <span className="text-sm text-blue-100">Admin Dashboard</span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Header - Only show on desktop */}
            {!isMobile && (
              <div 
                className="flex items-center h-28 border-b border-gray-100 bg-white cursor-pointer relative"
                onClick={toggleSidebar}
              >
                <div className="flex items-center justify-between w-full px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 relative flex items-center justify-center">
                      <Image
                        src="/images/logo/Icon/Logo icon.png"
                        alt="Way of Glory Logo"
                        fill
                        className="object-contain p-2"
                        priority
                      />
                    </div>
                    <motion.span
                      initial={false}
                      animate={{ 
                        opacity: isExpanded ? 1 : 0,
                        width: isExpanded ? 'auto' : 0 
                      }}
                      transition={{
                        opacity: { duration: 0.2 },
                        width: { duration: 0.2 }
                      }}
                      className="font-semibold text-gray-900 text-xl tracking-tight whitespace-nowrap overflow-hidden"
                    >
                      Way of Glory
                    </motion.span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className={cn(
              "flex-1 overflow-y-auto",
              isMobile ? "px-4 py-6" : "p-3"
            )}>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all",
                        isActive 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        isActive 
                          ? "bg-blue-100 text-blue-600" 
                          : "text-gray-500 group-hover:text-blue-600 bg-gray-50/80 group-hover:bg-blue-50"
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <motion.span
                        initial={false}
                        animate={{ 
                          opacity: isExpanded || isMobile ? 1 : 0,
                          width: isExpanded || isMobile ? 'auto' : 0 
                        }}
                        transition={{
                          opacity: { duration: 0.2 },
                          width: { duration: 0.2 }
                        }}
                        className="truncate whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    </motion.div>
                  )
                })}
              </div>
            </nav>

            {/* User Section */}
            <div className={cn(
              "border-t border-gray-100 bg-white",
              isMobile ? "px-4 py-6" : "p-3"
            )}>
              <div className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200",
                (isExpanded || isMobile) && "cursor-pointer"
              )}
              onClick={isMobile ? undefined : toggleSidebar}
              >
                <motion.div 
                  className="relative shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-medium shadow-sm group-hover:shadow-md group-hover:from-blue-500 group-hover:to-blue-400 transition-all duration-200">
                    {userName.split(' ').map(name => name[0]).join('')}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                </motion.div>
                <motion.div
                  initial={false}
                  animate={{ 
                    opacity: isExpanded || isMobile ? 1 : 0,
                    width: isExpanded || isMobile ? 'auto' : 0 
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    width: { duration: 0.2 }
                  }}
                  className="flex-1 min-w-0 whitespace-nowrap overflow-hidden"
                >
                  <p className="text-sm font-semibold text-gray-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {userEmail}
                  </p>
                </motion.div>
                {(isExpanded || isMobile) && (
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <motion.div
                initial={false}
                animate={{ 
                  opacity: isExpanded || isMobile ? 1 : 0,
                  height: isExpanded || isMobile ? 'auto' : 0 
                }}
                transition={{
                  opacity: { duration: 0.2 },
                  height: { duration: 0.2 }
                }}
                className="overflow-hidden px-1"
              >
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-gray-600 hover:text-red-600 hover:bg-red-50 justify-start gap-2 rounded-xl h-10 text-sm font-medium transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 