'use client'

import { Search, X, ShoppingBag, LayoutGrid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ProductsHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  isListView: boolean
  setIsListView: (isListView: boolean) => void
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  bundleItems: any[]
  isCheckoutOpen: boolean
}

export default function ProductsHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isListView,
  setIsListView,
  isCartOpen,
  setIsCartOpen,
  bundleItems,
  isCheckoutOpen
}: ProductsHeaderProps) {
  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 w-full transition-all duration-300",
        isCheckoutOpen 
          ? "z-[40] bg-white/40 backdrop-blur-xl border-transparent opacity-50 pointer-events-none"
          : "z-[44] bg-white/80 backdrop-blur-md border-b border-gray-200"
      )}
    >
      <div className={cn(
        "flex h-20 items-center justify-between gap-4 px-6",
        isCheckoutOpen && "opacity-50"
      )}>
        {/* Left side - Search */}
        <div className="w-full max-w-[320px] relative group">
          <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-500" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 h-12 bg-gray-50/80 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-xl text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Center - Categories */}
        <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide">
          <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm">
            <AnimatePresence mode="wait">
              {['all', 'Audio Gear', 'Streaming Gear', 'Services'].map((category) => (
                <motion.div key={category} className="relative">
                  <Button
                    variant={selectedCategory === category ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "h-8 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 relative whitespace-nowrap",
                      selectedCategory === category 
                        ? "bg-blue-50 text-blue-500" 
                        : "text-gray-600 hover:text-blue-500 hover:bg-blue-50/50"
                    )}
                  >
                    {category === 'all' ? 'All' : category.replace(' Gear', '')}
                  </Button>
                  {selectedCategory === category && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side - View options and Bundle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsListView(!isListView)}
            className="h-12 w-12 text-gray-500 hover:text-gray-900 rounded-xl"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isListView ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isListView ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </motion.div>
          </Button>

          {/* Bundle Button */}
          <Button
            variant="default"
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={cn(
              "h-12 px-5 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-3 rounded-xl transition-all duration-200",
              bundleItems.length > 0 && "ring-2 ring-blue-200"
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline text-base">Bundle</span>
            {bundleItems.length > 0 && (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
              >
                {bundleItems.reduce((sum, item) => sum + item.quantity, 0)}
              </motion.div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 