'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { SidebarProvider } from "@/contexts/SidebarContext"
import { Sidebar } from '@/components/ui/sidebar'
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = () => {
    // Implement logout logic
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar 
          isExpanded={isExpanded}
          toggleSidebar={toggleSidebar}
          pathname={pathname}
          handleLogout={handleLogout}
        />
        <main className={cn(
          "relative transition-all duration-300",
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
    </SidebarProvider>
  )
} 