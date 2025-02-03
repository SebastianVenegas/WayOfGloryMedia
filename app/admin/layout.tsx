'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/ui/sidebar/index"
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"
import Head from 'next/head'
import { AdminPWARegister } from './pwa'

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
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="application-name" content="WoG Media Admin" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WoG Media Admin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/icons/admin-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/admin-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/admin-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/admin-icon-167x167.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/admin-icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/admin-icon-16x16.png" />
      </Head>
      <AdminPWARegister />
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