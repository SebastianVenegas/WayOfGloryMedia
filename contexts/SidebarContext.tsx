'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
  children: ReactNode
  initialState?: boolean
}

export function SidebarProvider({ children, initialState = false }: SidebarProviderProps) {
  // Initialize from localStorage or use default collapsed state
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('sidebarExpanded')
      return saved ? JSON.parse(saved) === true : false
    } catch {
      return false
    }
  })

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded))
    } catch (error) {
      console.error('Failed to save sidebar state:', error)
    }
  }, [isExpanded])

  const toggleSidebar = () => {
    setIsExpanded((prev: boolean) => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
} 