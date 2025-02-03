'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = () => {
    // Implement logout logic
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isExpanded={isExpanded}
        toggleSidebar={toggleSidebar}
        pathname={pathname}
        handleLogout={handleLogout}
      />
      <main className={`transition-all duration-300 ${isExpanded ? 'ml-[280px]' : 'ml-[80px]'}`}>
        {children}
      </main>
    </div>
  )
} 