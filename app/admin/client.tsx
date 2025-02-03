'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from "@/components/ui/sidebar/index"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"
import { AdminPWARegister } from './pwa'
import { useEffect } from 'react'

interface AdminClientProps {
  children: React.ReactNode
}

function AdminContent({ children }: AdminClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, toggleSidebar } = useSidebar()
  const isLoginPage = pathname === '/admin/login'

  // Check authentication on mount and route change
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        
        if (!res.ok && !isLoginPage) {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (!isLoginPage) {
          router.push('/admin/login')
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
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminPWARegister />
      {!isLoginPage && (
        <Sidebar 
          isExpanded={isExpanded}
          toggleSidebar={toggleSidebar}
          pathname={pathname}
          handleLogout={handleLogout}
        />
      )}
      <main className={cn(
        "relative transition-all duration-300",
        !isLoginPage && (isExpanded ? 'ml-[280px]' : 'ml-[80px]')
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
    <SidebarProvider initialState={true}>
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  )
} 