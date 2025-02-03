'use client'

import { Search, X, ShoppingBag, LayoutGrid, List } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSidebar } from '@/contexts/SidebarContext'

const CATEGORIES = {
  'Audio Gear': {
    name: 'Audio Gear',
    subcategories: [
      { name: 'Microphones', path: 'Audio Gear/Mics' },
      { name: 'Mixers', path: 'Audio Gear/Mixers' },
      { name: 'Cables', path: 'Audio Gear/Cables' },
      { name: 'Snakes', path: 'Audio Gear/Snakes' },
      { name: 'Speakers', path: 'Audio Gear/Speakers' },
      { name: 'IEMS', path: 'Audio Gear/IEMS' },
      { name: 'Stands', path: 'Audio Gear/Stands' }
    ]
  },
  'Services': {
    name: 'Services',
    subcategories: [
      { name: 'Custom Services', path: 'Services/Custom' },
      { name: 'Standard Services', path: 'Services' }
    ]
  }
};

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
  const { isExpanded } = useSidebar()

  return (
    <div 
      style={{
        width: `calc(100% - ${isExpanded ? '280px' : '80px'})`,
        marginLeft: isExpanded ? '280px' : '80px'
      }}
      className={cn(
        "fixed top-0 right-0",
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
          <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 h-12 bg-gray-50/80 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl text-base"
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
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm">
            {['all', 'Audio Gear', 'Streaming Gear', 'Services'].map((category) => (
              <div key={category} className="relative">
                <Button
                  variant={selectedCategory.startsWith(category) ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "h-8 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg relative whitespace-nowrap",
                    selectedCategory.startsWith(category)
                      ? "bg-blue-50 text-blue-500" 
                      : "text-gray-600 hover:text-blue-500 hover:bg-blue-50/50"
                  )}
                >
                  {category === 'all' ? 'All' : category.replace(' Gear', '')}
                </Button>
                {selectedCategory.startsWith(category) && (
                  <div
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Subcategories */}
          {selectedCategory === 'Audio Gear' && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-2 max-w-full">
              {CATEGORIES['Audio Gear'].subcategories.map((subcat) => (
                <Button
                  key={subcat.path}
                  variant={selectedCategory === subcat.path ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(subcat.path)}
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-lg whitespace-nowrap",
                    selectedCategory === subcat.path
                      ? "bg-blue-100 text-blue-600" 
                      : "text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                  )}
                >
                  {subcat.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Right side - View options and Bundle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsListView(!isListView)}
            className="h-12 w-12 text-gray-500 hover:text-gray-900 rounded-xl"
          >
            <div>
              {isListView ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </div>
          </Button>

          {/* Bundle Button */}
          <Button
            variant="default"
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={cn(
              "h-12 px-5 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-3 rounded-xl",
              bundleItems.length > 0 && "ring-2 ring-blue-200"
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline text-base">Bundle</span>
            {bundleItems.length > 0 && (
              <div
                className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
              >
                {bundleItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 