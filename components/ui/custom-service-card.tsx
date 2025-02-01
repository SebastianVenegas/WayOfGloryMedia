import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ChevronRight, ArrowRight, Pencil, Check } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface CustomService {
  id: string
  title: string
  description: string
  price: number
  features?: string[]
  category: string
  created_by?: string
  created_at?: string
}

interface CustomServiceCardProps {
  service: CustomService
  onSelect: (service: CustomService) => void
  isEditable?: boolean
  onEdit?: (service: CustomService) => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.4
    }
  }
}

export default function CustomServiceCard({ 
  service, 
  onSelect, 
  isEditable = false,
  onEdit
}: CustomServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={itemVariants}
      className="group relative bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Service Type Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="px-2.5 py-1 bg-blue-50/90 text-blue-600 rounded-full text-xs font-medium border border-blue-100/50 backdrop-blur-sm">
          {service.category}
        </span>
      </div>

      <div className="p-6">
        {/* Icon Section */}
        <div className="mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/50 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
            <Settings className="h-7 w-7 text-blue-600" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2.5">
            {service.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Features List */}
        {service.features && service.features.length > 0 && (
          <div className="mb-6">
            <div className="space-y-2.5">
              {service.features.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
            {service.features.length > 3 && (
              <button 
                onClick={() => onSelect(service)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group/btn"
              >
                View {service.features.length - 3} more features
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <button
            onClick={() => onSelect(service)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 group/btn"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
          {isEditable && onEdit && (
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Created By Info */}
        {service.created_by && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs text-gray-400">
              Created by {service.created_by}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
} 