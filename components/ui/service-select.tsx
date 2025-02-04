import { motion } from "framer-motion"
import { Package, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  id?: string
  title: string
  description: string
  price: number
  features: string[]
  category: string
  is_custom: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
}

interface ServiceSelectProps {
  services: Service[]
  onSelect: (service: Service) => void
  isLoading?: boolean
}

export default function ServiceSelect({ services, onSelect, isLoading = false }: ServiceSelectProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading services...</p>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No custom services found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {services.map((service) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "group relative bg-white border rounded-xl p-6 hover:shadow-md transition-all cursor-pointer",
            "hover:border-blue-200 hover:bg-blue-50/30"
          )}
          onClick={() => onSelect(service)}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                  {service.category}
                </span>
                {service.created_at && (
                  <span className="text-xs text-gray-500">
                    Created {new Date(service.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {service.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {service.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-600 text-xs"
                  >
                    {feature}
                  </span>
                ))}
                {service.features.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-500 text-xs">
                    +{service.features.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold text-gray-900">
                ${service.price}
              </span>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-5 w-5 text-blue-600" />
          </div>
        </motion.div>
      ))}
    </div>
  )
} 