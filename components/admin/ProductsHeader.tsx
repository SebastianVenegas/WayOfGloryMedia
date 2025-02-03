'use client'

import { Search, X, ShoppingBag, LayoutGrid, List, Mic2, Sliders, Cable, Network, Speaker, Headphones, MoveUpRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSidebar } from '@/contexts/SidebarContext'

const CATEGORIES = {
  'Audio Gear': {
    name: 'Audio Gear',
    subcategories: [
      { name: 'Microphones', path: 'Audio Gear/Mics', icon: Mic2 },
      { name: 'Mixers', path: 'Audio Gear/Mixers', icon: Sliders },
      { name: 'Cables', path: 'Audio Gear/Cables', icon: Cable },
      { name: 'Snakes', path: 'Audio Gear/Snakes', icon: Network },
      { name: 'Speakers', path: 'Audio Gear/Speakers', icon: Speaker },
      { name: 'IEMS', path: 'Audio Gear/IEMS', icon: Headphones },
      { name: 'Stands', path: 'Audio Gear/Stands', icon: MoveUpRight }
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
  const isAudioCategory = selectedCategory === 'Audio Gear' || selectedCategory.startsWith('Audio Gear/')

  return (
    <>
      {/* Main Header */}
      <div 
        style={{
          width: `calc(100% - ${isExpanded ? '280px' : '80px'})`,
          marginLeft: isExpanded ? '280px' : '80px'
        }}
        className={cn(
          "fixed top-0 right-0 h-20 transition-all duration-300",
          isCheckoutOpen 
            ? "z-[40] bg-white/40 backdrop-blur-xl border-transparent opacity-50 pointer-events-none"
            : "z-[44] bg-white/90 backdrop-blur-md shadow-sm"
        )}
      >
        <div className={cn(
          "flex h-full items-center justify-between gap-4 px-6 border-b border-gray-100",
          isCheckoutOpen && "opacity-50"
        )}>
          {/* Left side - Search */}
          <div className="w-full max-w-[320px] relative group">
            <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors duration-200" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 h-12 bg-gray-50/80 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl text-base transition-shadow duration-200"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                      "h-9 px-4 text-sm font-medium rounded-lg relative whitespace-nowrap transition-all duration-200",
                      selectedCategory.startsWith(category)
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-gray-600 hover:text-blue-500 hover:bg-white/50"
                    )}
                  >
                    {category === 'all' ? 'All' : category.replace(' Gear', '')}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - View options and Bundle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsListView(!isListView)}
              className="h-12 w-12 text-gray-500 hover:text-gray-900 rounded-xl transition-colors duration-200 hover:bg-gray-100"
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
                "h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-3 rounded-xl transition-all duration-200",
                bundleItems.length > 0 && "ring-4 ring-blue-100"
              )}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline text-base font-medium">Bundle</span>
              {bundleItems.length > 0 && (
                <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-sm">
                  {bundleItems.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Left Side Subcategories */}
      {isAudioCategory && (
        <div 
          style={{
            width: '240px',
            left: isExpanded ? '280px' : '80px'
          }}
          className="fixed top-20 bottom-0 bg-white border-r border-gray-100 shadow-sm transition-all duration-300 z-40"
        >
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 px-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Categories</h3>
            </div>
            {CATEGORIES['Audio Gear'].subcategories.map((subcat) => {
              const Icon = subcat.icon;
              return (
                <Button
                  key={subcat.path}
                  variant={selectedCategory === subcat.path ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(subcat.path)}
                  className={cn(
                    "justify-start h-10 px-4 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 w-full",
                    selectedCategory === subcat.path
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/80"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 mr-3 flex-shrink-0" />}
                  {subcat.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  )
} 