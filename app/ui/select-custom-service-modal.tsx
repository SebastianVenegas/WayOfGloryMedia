import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SelectCustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (service: CustomService) => void
  services: CustomService[]
}

interface CustomService {
  id: string
  title: string
  description: string
  price: string | number
  features: string[]
  category: string
  is_custom: boolean
}

export function SelectCustomServiceModal({ isOpen, onClose, onSelect, services }: SelectCustomServiceModalProps) {
  const formatPrice = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 bg-gradient-to-b from-white to-gray-50/50 rounded-2xl border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Select Custom Service
              </DialogTitle>
              <p className="text-sm text-gray-500">
                Choose from our professionally curated custom services
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {services.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                        <Wrench className="h-7 w-7 text-blue-600" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {service.title}
                            </h3>
                            <p className="text-sm font-medium text-blue-600">
                              ${formatPrice(service.price)}
                            </p>
                          </div>
                          <Button
                            onClick={() => onSelect(service)}
                            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm ml-4 transition-all duration-200"
                          >
                            Add to Bundle
                          </Button>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                        {service.features.length > 0 && (
                          <ul className="space-y-2.5 border-t pt-4">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-600 group/feature">
                                <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-blue-500 group-hover/feature:translate-x-0.5 transition-transform" />
                                <span className="flex-1 group-hover/feature:text-gray-900 transition-colors">
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No custom services available</h3>
                <p className="mt-2 text-sm text-gray-500">Create a new custom service to get started.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 