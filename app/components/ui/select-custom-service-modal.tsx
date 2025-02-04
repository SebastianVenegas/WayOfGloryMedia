import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, ArrowRight, Eye, Edit, Clock, Check, DollarSign, Plus, Save } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"
import CustomServiceModal, { CustomService } from "./custom-service-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  onEdit,
  isEditMode,
  onSave,
  onToggleMode
}: { 
  service: CustomService
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  isEditMode: boolean
  onSave: (service: CustomService) => void
  onToggleMode: () => void
}) {
  const [formData, setFormData] = useState<CustomService>(service)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold text-white">
              {isEditMode ? "Edit Service" : service.title}
            </DialogTitle>
            <div className="relative">
              <Button
                onClick={onToggleMode}
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-12 py-6 h-auto text-xl font-semibold rounded-2xl"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-6 w-6 mr-3" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit className="h-6 w-6 mr-3" />
                    Edit
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute -right-3 -top-3 rounded-full w-8 h-8 bg-blue-700/50 hover:bg-blue-700/70 text-white border-none p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isEditMode && (
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                <Clock className="h-4 w-4 mr-1.5" />
                Flexible Schedule
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                <Check className="h-4 w-4 mr-1.5" />
                Professional Service
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="bg-white p-8 rounded-b-2xl">
          {isEditMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Service Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Premium Audio Setup"
                    className="bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="pl-8 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your service in detail..."
                  className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Features</label>
                  <Button
                    type="button"
                    onClick={addFeature}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </div>
                <motion.div layout className="space-y-3">
                  {formData.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        className="flex-1 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        onClick={() => removeFeature(index)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 border-t">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this Service</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
                  <div className="space-y-3">
                    {service.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-4 rounded-lg bg-gray-50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-gray-700">{feature}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Price</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold text-blue-600">
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 mt-4"
                      onClick={onClose}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Close Preview
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Service Details</h3>
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
          )}
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
  const [isEditMode, setIsEditMode] = useState(false)

  const formatPrice = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return !isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'
  }

  const handlePreview = (service: CustomService) => {
    setPreviewService(service)
    setIsPreviewOpen(true)
    setIsEditMode(false)
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleToggleMode = () => {
    setIsEditMode(!isEditMode)
  }

  const handleUpdateService = (updatedService: CustomService) => {
    if (onUpdate) {
      onUpdate(updatedService)
    }
    setIsEditMode(false)
    setIsPreviewOpen(false)
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
                className="rounded-full w-8 h-8 bg-gray-100/80 hover:bg-gray-200/80 text-gray-600"
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
            setIsEditMode(false)
          }}
          onEdit={handleEdit}
          isEditMode={isEditMode}
          onSave={handleUpdateService}
          onToggleMode={handleToggleMode}
        />
      )}
    </>
  )
} 