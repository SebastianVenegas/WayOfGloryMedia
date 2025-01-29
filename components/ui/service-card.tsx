import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  title: string
  description: string
  price: number
  features?: string[]
  category: string
}

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
}

export default function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300"
    >
      {/* Service Badge */}
      <div className="absolute top-4 right-4">
        <div className="px-2.5 py-1 bg-blue-50/80 text-blue-600 rounded-full text-xs font-medium border border-blue-100/50">
          Consultation Service
        </div>
      </div>

      <div className="p-6">
        {/* Service Icon */}
        <div className="mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/50 flex items-center justify-center">
            <div className="w-6 h-6 text-blue-600">
              {/* You can add icon logic here based on service category */}
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
            {service.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Features */}
        {service.features && (
          <div className="mb-6">
            <div className="space-y-2">
              {service.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
            {service.features.length > 3 && (
              <button 
                onClick={() => onSelect(service)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
              >
                +{service.features.length - 3} more features
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="pt-4 mt-auto border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                ${service.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">Starting Price</p>
            </div>
            <Button
              onClick={() => onSelect(service)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 gap-1.5"
              size="sm"
            >
              Book Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 