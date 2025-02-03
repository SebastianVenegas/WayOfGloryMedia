'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/ui/sidebar/index"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminContent({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { isExpanded, toggleSidebar } = useSidebar()

  const handleLogout = () => {
    // Implement logout logic
  }

  return (
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
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider initialState={true}>
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  )
} 