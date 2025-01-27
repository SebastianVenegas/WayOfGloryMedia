'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm backdrop-blur-xl bg-white/80">
        <div className="max-w-[2000px] mx-auto">
          <div className="h-16 flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex items-center max-w-md relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-gray-100/80 p-1 rounded-lg">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "rounded-md transition-all duration-200",
                    selectedCategory === 'all' ? 'shadow-sm' : 'hover:bg-white/50'
                  )}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === 'Audio' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Audio')}
                  className={cn(
                    "rounded-md transition-all duration-200",
                    selectedCategory === 'Audio' ? 'shadow-sm' : 'hover:bg-white/50'
                  )}
                >
                  Audio
                </Button>
                <Button
                  variant={selectedCategory === 'Streaming' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Streaming')}
                  className={cn(
                    "rounded-md transition-all duration-200",
                    selectedCategory === 'Streaming' ? 'shadow-sm' : 'hover:bg-white/50'
                  )}
                >
                  Streaming
                </Button>
                <Button
                  variant={selectedCategory === 'Training' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Training')}
                  className={cn(
                    "rounded-md transition-all duration-200",
                    selectedCategory === 'Training' ? 'shadow-sm' : 'hover:bg-white/50'
                  )}
                >
                  Training
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Service cards will be rendered here */}
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Add a new service</p>
          </div>
        </div>
      </div>
    </div>
  )
} 