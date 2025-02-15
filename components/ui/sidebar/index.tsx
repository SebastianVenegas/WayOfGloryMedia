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

  const handleNavigation = (href: string) => {
    router.push(href)
    // Auto collapse sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      toggleSidebar()
    }
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 z-[40] bg-white border-r border-gray-100 flex flex-col shadow-sm select-none",
        isExpanded ? "w-[280px]" : "w-[64px] md:w-[80px]"
      )}
      style={{ 
        transition: 'width 100ms ease-in-out',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center h-16 md:h-20 px-3 md:px-4 border-b border-gray-100 bg-white"
        onClick={toggleSidebar}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700">
            <Speaker className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <span className={cn(
            "font-semibold text-gray-900 text-base md:text-lg tracking-tight transition-opacity duration-100",
            isExpanded ? "opacity-100" : "opacity-0 hidden"
          )}>
            Way of Glory
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            toggleSidebar()
          }}
          className="h-9 w-9 md:h-10 md:w-10 hover:bg-gray-100 rounded-xl text-gray-500 hidden md:flex"
        >
          {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full group flex items-center gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-sm font-medium cursor-pointer active:scale-[0.98] transition-transform",
                isActive 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-white active:bg-gray-50"
              )}
            >
              <div className={cn(
                "p-1.5 md:p-2 rounded-lg",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-500 group-hover:text-blue-600 bg-gray-50/80 group-hover:bg-blue-50"
              )}>
                <item.icon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <span className={cn(
                "truncate transition-opacity duration-100 text-sm",
                isExpanded ? "opacity-100" : "opacity-0 hidden"
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute inset-0 bg-white -z-10" />
              )}
            </div>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-2 md:p-3 border-t border-gray-100 bg-white">
        <div className={cn(
          "flex items-center gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors",
          isExpanded && "cursor-pointer"
        )}
        onClick={toggleSidebar}
        >
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
            W
          </div>
          <div className={cn(
            "flex-1 min-w-0 transition-opacity duration-100",
            isExpanded ? "opacity-100" : "opacity-0 hidden"
          )}>
            <p className="text-sm font-medium text-gray-900 truncate">Staff Account</p>
            <p className="text-xs text-gray-500 truncate">staff@wayofglory.com</p>
          </div>
        </div>
        {isExpanded && (
          <Button
            variant="ghost"
            className="w-full mt-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 justify-start gap-2 rounded-xl h-10 md:h-11 text-sm transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        )}
      </div>
    </div>
  )
} 