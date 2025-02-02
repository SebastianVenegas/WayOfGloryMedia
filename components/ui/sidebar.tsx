'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Package2,
  ShoppingCart,
  BarChart,
  LogOut,
  ChevronLeft,
  Settings,
  Users,
  Bell,
  Home,
  CircleUserRound,
  Search
} from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { toast } from 'sonner'

interface SidebarProps {
  className?: string
}

interface User {
  email: string;
  name: string;
  role: string;
}

const sidebarVariants = {
  expanded: {
    width: 288,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  collapsed: {
    width: 80,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
}

const itemVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
}

const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const event = new CustomEvent('sidebarStateChange', { 
      detail: { expanded: !isCollapsed } 
    })
    window.dispatchEvent(event)
  }, [isCollapsed])

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/admin',
      badge: null,
      color: 'from-violet-500 to-violet-600'
    },
    {
      title: 'Products',
      icon: Package2,
      href: '/admin/products',
      badge: '24',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Order Builder',
      icon: ShoppingCart,
      href: '/admin/orders/new',
      badge: null,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Analytics',
      icon: BarChart,
      href: '/admin/analytics',
      badge: null,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Customers',
      icon: Users,
      href: '/admin/customers',
      badge: '3',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Notifications',
      icon: Bell,
      href: '/admin/notifications',
      badge: '5',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      badge: null,
      color: 'from-gray-600 to-gray-700'
    }
  ]

  const filteredItems = navigationItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Signed out successfully')
        router.push('/admin/login')
      } else {
        throw new Error('Failed to sign out')
      }
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={sidebarVariants}
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={cn(
          'fixed left-0 top-0 z-[70] h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="logo"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Glory Way
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl hover:bg-gray-100 transition-all duration-200",
              isCollapsed && "rotate-180"
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* User Profile */}
        <div className={cn(
          "px-4 py-3 border-b",
          isCollapsed ? "flex justify-center" : "flex items-center gap-3"
        )}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">{user?.name?.[0] || 'A'}</span>
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                variants={itemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex-1 min-w-0"
              >
                <p className="font-medium truncate">{user?.name || 'Loading...'}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email || 'Loading...'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 border-0 focus-visible:ring-1 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          <AnimatePresence mode="wait">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full relative group',
                          isCollapsed ? 'justify-center' : 'justify-start gap-3',
                          isActive ? 'bg-gray-900/5 hover:bg-gray-900/10' : 'hover:bg-gray-900/[0.02]',
                          'py-3 rounded-xl transition-all duration-200'
                        )}
                      >
                        <div className={cn(
                          'relative flex items-center justify-center',
                          isActive && 'text-white'
                        )}>
                          {isActive && (
                            <motion.div
                              layoutId="activeBackground"
                              className={cn(
                                'absolute inset-0 -m-1 rounded-lg bg-gradient-to-r',
                                item.color
                              )}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <item.icon className={cn(
                            'h-5 w-5 relative',
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                          )} />
                        </div>
                        
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.span
                              variants={itemVariants}
                              initial="collapsed"
                              animate="expanded"
                              exit="collapsed"
                              className={cn(
                                "font-medium",
                                isActive && `bg-gradient-to-r ${item.color} bg-clip-text text-transparent`
                              )}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Badge */}
                        {item.badge && (
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-medium",
                            isActive 
                              ? `bg-gradient-to-r ${item.color} text-white` 
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-6 hidden group-hover:block">
                            <div className={cn(
                              "px-3 py-2 rounded-lg text-sm text-white whitespace-nowrap",
                              `bg-gradient-to-r ${item.color}`
                            )}>
                              {item.title}
                              {item.badge && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className={cn(
                              "absolute top-1/2 -left-1 -translate-y-1/2 border-8 border-transparent",
                              `border-r-[${item.color.split(' ')[1]}]`
                            )} />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className={cn(
              'w-full relative group',
              isCollapsed ? 'justify-center' : 'justify-start gap-3',
              'py-3 rounded-xl hover:bg-red-50'
            )}
            onClick={handleSignOut}
          >
            <div className="relative flex items-center justify-center">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="font-medium text-red-600"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
            
            {isCollapsed && (
              <div className="absolute left-full ml-6 hidden group-hover:block">
                <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                  Sign out
                </div>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-8 border-transparent border-r-red-600" />
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </>
  )
} 