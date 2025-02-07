import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, ArrowRight, Edit, Eye, Clock, Check, DollarSign, Plus, Save, Sparkles, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Define the CustomService type here
export interface CustomService {
  id?: string
  title: string
  description: string
  price: number | string
  features: string[]
  category: string
  is_custom: boolean
  created_at?: string
  updated_at?: string
  quantity?: number
  skip_tax?: boolean
  metadata?: {
    targetAudience?: string
    estimatedDuration?: string
    tier?: string
    category?: string
    duration?: string
    maxCapacity?: number
    tags?: string[]
    isClientSpecific?: boolean
    clientName?: string | null
  }
}

interface SelectCustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (service: CustomService) => void
  onUpdate?: (service: CustomService) => void
  services: CustomService[]
  onRefresh?: () => Promise<void>
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const slideIn = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

function ServicePreviewModal({ 
  service, 
  isOpen, 
  onClose,
  onEdit,
  isEditMode,
  onSave,
  onToggleMode,
  onRefresh
}: { 
  service: CustomService
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  isEditMode: boolean
  onSave: (service: CustomService) => void
  onToggleMode: () => void
  onRefresh?: () => Promise<void>
}) {
  const [formData, setFormData] = useState<CustomService>(service)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      if (onRefresh) {
        await onRefresh()
      }
      onClose()
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnhanceWithAI = async () => {
    setIsEnhancing(true)
    try {
      const response = await fetch('/api/admin/enhance-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          features: formData.features.filter((f: string) => f.trim()),
          price: formData.price
        })
      })

      if (!response.ok) throw new Error('Failed to enhance service')

      const enhanced = await response.json()
      setFormData((prev: CustomService) => ({
        ...prev,
        title: enhanced.title || prev.title,
        description: enhanced.description || prev.description,
        features: enhanced.features || prev.features,
        price: enhanced.price || prev.price
      }))
    } catch (error) {
      console.error('Error enhancing service:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const updateFeature = (index: number, value: string) => {
    setFormData((prev: CustomService) => ({
      ...prev,
      features: prev.features.map((f: string, i: number) => i === index ? value : f)
    }))
  }

  const addFeature = () => {
    setFormData((prev: CustomService) => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const removeFeature = (index: number) => {
    setFormData((prev: CustomService) => ({
      ...prev,
      features: prev.features.filter((_: string, i: number) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 bg-white rounded-2xl border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-8 pb-6 border-b bg-blue-50/50">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              className="space-y-2"
            >
              <DialogTitle className="text-3xl font-bold text-gray-900">
                {isEditMode ? "Edit Service" : service.title}
              </DialogTitle>
              {!isEditMode && (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Flexible Schedule
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm">
                    <Check className="h-4 w-4 mr-2 text-blue-600" />
                    Professional Service
                  </span>
                </div>
              )}
            </motion.div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onToggleMode}
                variant="outline"
                size="lg"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 px-6 py-6 h-auto text-base font-medium rounded-xl"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-5 w-5 mr-2" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 mr-2" />
                    Edit
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full w-9 h-9 hover:bg-blue-100/50 text-gray-500 hover:text-blue-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8">
          {isEditMode ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-gray-700">Service Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Premium Audio Setup"
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg hover:border-blue-200"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="pl-9 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg hover:border-blue-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your service in detail..."
                  className="min-h-[120px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none hover:border-blue-200"
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
                    className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Feature
                  </Button>
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.div layout className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        layout
                        initial={slideIn.initial}
                        animate={slideIn.animate}
                        exit={slideIn.exit}
                        className="flex gap-3"
                      >
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="flex-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg hover:border-blue-200"
                        />
                        <Button
                          type="button"
                          onClick={() => removeFeature(index)}
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-3 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  variant="outline"
                  disabled={isEnhancing}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-6"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Enhance with AI
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-700 rounded-lg px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <motion.div 
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900">About this Service</h3>
                  <p className="text-gray-600 leading-relaxed text-base">{service.description}</p>
                </motion.div>

                <motion.div
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
                  <div className="grid gap-3">
                    {service.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-gray-700">{feature}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={slideIn.initial}
                animate={slideIn.animate}
                className="space-y-6"
              >
                <div className="rounded-xl border border-blue-100 p-6 bg-gradient-to-b from-blue-50/50 to-white shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Price</h3>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-3xl font-bold text-blue-600">
                          ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                        </span>
                        <span className="text-gray-500">/service</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-blue-100">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Service Highlights:</h4>
                      <ul className="space-y-2.5">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="line-clamp-1">{feature}</span>
                          </li>
                        ))}
                        {service.features.length > 3 && (
                          <li className="text-sm text-blue-500 pl-6">
                            +{service.features.length - 3} more included
                          </li>
                        )}
                      </ul>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg py-5 mt-4"
                      onClick={onClose}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Close Preview
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 p-6 bg-white shadow-sm">
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
              </motion.div>
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
  services,
  onRefresh 
}: SelectCustomServiceModalProps) {
  const [previewService, setPreviewService] = useState<CustomService | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = async () => {
    if (!onRefresh) return
    setIsLoading(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Error refreshing services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isOpen])

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

  const handleUpdateService = async (updatedService: CustomService) => {
    if (onUpdate) {
      await onUpdate(updatedService)
      if (onRefresh) {
        await onRefresh()
      }
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshData}
                  disabled={isLoading}
                  className={cn(
                    "rounded-full w-8 h-8 border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200",
                    isLoading && "animate-pulse"
                  )}
                >
                  <svg
                    className={cn(
                      "h-4 w-4",
                      isLoading && "animate-spin"
                    )}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full w-8 h-8 bg-gray-100/80 hover:bg-gray-200/80 text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {isLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-base font-medium">Refreshing services...</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Auto-refreshes every 30 seconds
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={services.length} // Force re-render on services change
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
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
                  </motion.div>
                </AnimatePresence>
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
          onRefresh={onRefresh}
        />
      )}
    </>
  )
} 