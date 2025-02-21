'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from "@/components/ui/sidebar/index"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"
import { AdminPWARegister } from './pwa'
import { useEffect, useState } from 'react'

interface AdminClientProps {
  children: React.ReactNode
}

function AdminContent({ children }: AdminClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, toggleSidebar } = useSidebar()
  const isLoginPage = pathname === '/admin/login'
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount and route change
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        
        if (!res.ok && !isLoginPage) {
          setIsAuthenticated(false)
          window.location.href = '/admin/login'
        } else {
          // Get user data from localStorage
          const email = localStorage.getItem('admin_email')
          const name = localStorage.getItem('admin_name')
          const token = localStorage.getItem('admin_token')
          if (email && name && token) {
            setUserEmail(email)
            setUserName(name)
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        if (!isLoginPage) {
          window.location.href = '/admin/login'
        }
      }
    }

    checkAuth()
  }, [pathname, router, isLoginPage])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_email')
      localStorage.removeItem('admin_name')
      setIsAuthenticated(false)
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/admin/login'
    }
  }

  if (isLoginPage || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminPWARegister />
        <main>
          {children}
        </main>
        <Toaster 
          position="bottom-center"
          duration={2000}
          className="mb-4"
          closeButton
          richColors
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPWARegister />
      <Sidebar 
        isExpanded={isExpanded}
        toggleSidebar={toggleSidebar}
        pathname={pathname}
        handleLogout={handleLogout}
        userEmail={userEmail}
        userName={userName}
      />
      <main className={cn(
        "relative transition-all duration-300 bg-gray-50 min-h-screen",
        isExpanded ? 'ml-[280px]' : 'ml-[80px]'
      )}>
        {children}
      </main>
      <Toaster 
        position="bottom-center"
        duration={2000}
        className="mb-4"
        closeButton
        richColors
      />
    </div>
  )
}

export default function AdminClient({ children }: AdminClientProps) {
  return (
    <SidebarProvider initialState={false}>
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  )
} 