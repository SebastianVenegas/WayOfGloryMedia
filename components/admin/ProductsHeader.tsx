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
    <div 
      style={{
        width: `calc(100% - ${isExpanded ? '280px' : '80px'})`,
        marginLeft: isExpanded ? '280px' : '80px'
      }}
      className={cn(
        "fixed top-0 right-0 transition-all duration-300",
        "md:fixed md:top-0 md:right-0",
        "w-full md:w-auto",
        "left-0 md:left-auto",
        "mt-20 md:mt-0",
        isCheckoutOpen 
          ? "z-[40] bg-white/40 backdrop-blur-xl border-transparent opacity-50 pointer-events-none"
          : "z-[44] bg-white/90 backdrop-blur-md shadow-sm"
      )}
    >
      {/* Main Header Row */}
      <div className={cn(
        "flex h-20 items-center gap-4 px-6 border-b border-gray-100",
        "overflow-x-auto",
        isCheckoutOpen && "opacity-50"
      )}>
        {/* Left side - Search and Categories */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-full md:w-[280px] relative group">
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

          <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm min-w-0 overflow-x-auto no-scrollbar">
            {['all', 'Audio Gear', 'Streaming Gear', 'Services'].map((category) => (
              <div key={category} className="relative flex-shrink-0">
                <Button
                  variant={selectedCategory.startsWith(category) ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "h-9 px-4 text-sm font-medium rounded-lg relative whitespace-nowrap transition-all duration-200",
                    "flex-shrink-0",
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
        <div className="flex items-center gap-3 flex-shrink-0">
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

      {/* Subcategories Row */}
      {isAudioCategory && (
        <div className="h-14 px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md overflow-x-auto">
          <div className="h-full flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm min-w-0 overflow-x-auto no-scrollbar">
              {CATEGORIES['Audio Gear'].subcategories.map((subcat) => {
                const Icon = subcat.icon;
                return (
                  <Button
                    key={subcat.path}
                    variant={selectedCategory === subcat.path ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategory(subcat.path)}
                    className={cn(
                      "h-9 px-4 text-sm font-medium rounded-lg relative whitespace-nowrap transition-all duration-200",
                      "flex-shrink-0",
                      selectedCategory === subcat.path
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-gray-600 hover:text-blue-500 hover:bg-white/50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                      {subcat.name}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 