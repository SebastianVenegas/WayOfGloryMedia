'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "../button"
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { 
  LayoutGrid, 
  Package, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Users,
  ClipboardList,
  BarChart,
  Speaker,
  LogOut,
  Mic2
} from 'lucide-react'

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
}

export function Sidebar({ isExpanded, toggleSidebar, pathname, handleLogout }: SidebarProps) {
  const router = useRouter()

  const handleNavigation = (e: React.MouseEvent | React.TouchEvent, href: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(href)
  }

  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? '280px' : '80px',
        transition: { duration: 0.3 }
      }}
      className="fixed left-0 top-0 bottom-0 z-[40] bg-white/90 backdrop-blur-md border-r border-gray-100 flex flex-col shadow-sm touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Header */}
      <div className="flex items-center h-20 px-4 border-b border-gray-100 bg-white/80">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 shadow-sm ring-1 ring-white/20">
            <Speaker className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span 
                key="title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-gray-900 text-lg tracking-tight"
              >
                Way of Glory
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleSidebar()
          }}
          className="h-10 w-10 hover:bg-gray-100/80 rounded-xl text-gray-500 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-none">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={cn(
                "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden hover:shadow-sm touch-manipulation select-none",
                isActive 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={cn(
                "relative z-10 p-2 rounded-lg transition-colors duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/50" 
                  : "text-gray-500 group-hover:text-blue-600 bg-gray-50/80 group-hover:bg-blue-50/80"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              {!isExpanded && (
                <div className="fixed left-[70px] px-3 py-2 bg-gray-900 text-xs font-medium text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              )}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span 
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-white to-white/95 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all touch-manipulation select-none",
          isExpanded && "cursor-pointer"
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium shadow-sm ring-1 ring-white/20">
            W
          </div>
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div 
                key="user-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-900 truncate">Staff Account</p>
                <p className="text-xs text-gray-500 truncate">staff@wayofglory.com</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key="logout-button"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-600 hover:text-gray-900 hover:bg-white justify-start gap-2 rounded-xl h-11 touch-manipulation select-none"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleLogout()
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 