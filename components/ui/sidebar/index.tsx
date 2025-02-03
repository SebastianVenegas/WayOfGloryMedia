'use client'

import { motion } from 'framer-motion'
import { Button } from "../button"
import Link from 'next/link'
import { cn } from '@/lib/utils'
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

interface SidebarProps {
  isExpanded: boolean
  toggleSidebar: () => void
  pathname: string
  handleLogout: () => void
}

export function Sidebar({ isExpanded, toggleSidebar, pathname, handleLogout }: SidebarProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? '280px' : '80px',
        transition: { duration: 0.3 }
      }}
      className="fixed left-0 top-0 bottom-0 z-[40] bg-white/80 border-r border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-white/90">
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
          className="hover:bg-gray-100/80 rounded-lg"
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
                  ? "bg-white/80 text-gray-900" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              )}
            >
              <div className={cn(
                "relative z-10 p-1.5 rounded-lg transition-colors duration-200",
                isActive ? `${item.color} bg-white/80 shadow-sm` : "text-gray-400 group-hover:text-gray-500"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              {!isExpanded && (
                <div className="fixed left-[70px] px-2.5 py-1.5 bg-gray-900/90 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
                  className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 -z-10"
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
          "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 transition-colors",
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
            className="w-full mt-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 justify-start gap-2 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        )}
      </div>
    </motion.div>
  )
} 