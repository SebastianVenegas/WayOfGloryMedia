"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  defaultValue?: string
  className?: string
  children?: React.ReactNode
  tabs?: { id: string; label: string; content: any }[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  onClick?: () => void
  isActive?: boolean
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
  isActive?: boolean
}

const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
}>({
  value: "",
  onChange: () => {}
})

export function Tabs({ defaultValue, className, children, tabs, activeTab, onTabChange }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue || activeTab)

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onTabChange?.(newValue)
  }

  if (tabs) {
    return (
      <div className={cn("w-full", className)}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => handleChange(tab.id)}
              isActive={activeTab === tab.id}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} isActive={activeTab === tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </div>
    )
  }

  return (
    <TabsContext.Provider value={{ value: value || "", onChange: handleChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-14 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const { value: selectedValue, onChange } = React.useContext(TabsContext)
  const isActive = value === selectedValue

  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-white text-[#1a365d] shadow-sm",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext)
  const isActive = value === selectedValue

  if (!isActive) return null

  return (
    <div
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  )
} 