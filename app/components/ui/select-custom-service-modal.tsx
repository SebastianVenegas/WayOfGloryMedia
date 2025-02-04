import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, ArrowRight, Eye, Edit, Clock, Check, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"
import CustomServiceModal, { CustomService } from "./custom-service-modal"

interface SelectCustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (service: CustomService) => void
  onUpdate?: (service: CustomService) => void
  services: CustomService[]
}

function ServicePreviewModal({ 
  service, 
  isOpen, 
  onClose,
  onEdit
}: { 
  service: CustomService
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 bg-gradient-to-b from-white to-gray-50/50 rounded-2xl border-none shadow-2xl">
        <div className="relative h-40 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                {service.title}
              </h2>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Flexible Schedule
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                  <Check className="h-4 w-4 mr-1.5" />
                  Professional Service
                </span>
              </div>
            </div>
            <Button
              onClick={onEdit}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Service
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About this Service</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
                <div className="grid gap-3">
                  {service.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-700">{feature}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 p-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Price</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-600">
                        ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500">/service</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Service Highlights:</h4>
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 mr-2 text-blue-500" />
                          {feature}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-sm text-gray-500 pl-6">
                          +{service.features.length - 3} more included
                        </li>
                      )}
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    onClick={onClose}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Close Preview
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-6 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{service.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {service.is_custom ? 'Custom Service' : 'Standard Service'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SelectCustomServiceModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  onUpdate,
  services 
}: SelectCustomServiceModalProps) {
  const [previewService, setPreviewService] = useState<CustomService | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const formatPrice = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'
  }

  const handlePreview = (service: CustomService) => {
    setPreviewService(service)
    setIsPreviewOpen(true)
  }

  const handleEdit = () => {
    setIsPreviewOpen(false)
    setIsEditOpen(true)
  }

  const handleUpdateService = (updatedService: CustomService) => {
    if (onUpdate) {
      onUpdate(updatedService)
    }
    setIsEditOpen(false)
    setPreviewService(null)
  }

  return (
    <>
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
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handlePreview(service)}
                                variant="outline"
                                size="sm"
                                className="text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-200"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                onClick={() => onSelect(service)}
                                className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm transition-all duration-200"
                              >
                                Add to Bundle
                              </Button>
                            </div>
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

      {previewService && (
        <ServicePreviewModal
          service={previewService}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setPreviewService(null)
          }}
          onEdit={handleEdit}
        />
      )}

      {previewService && (
        <CustomServiceModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false)
            setPreviewService(null)
          }}
          onSave={handleUpdateService}
          initialData={previewService}
        />
      )}
    </>
  )
} 