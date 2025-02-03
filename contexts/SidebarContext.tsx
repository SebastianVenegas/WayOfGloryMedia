'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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

export function SidebarProvider({ children, initialState = true }: SidebarProviderProps) {
  const [isExpanded, setIsExpanded] = useState(initialState)

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev)
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