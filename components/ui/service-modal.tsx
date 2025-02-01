import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog-custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, DollarSign, FileText, X, ArrowRight, CheckCircle, Info, Package, Check, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useServiceSetup } from "@/lib/store/serviceSetup"

interface Service {
  id: string
  title: string
  description: string
  price: number
  features?: string[]
  category: string
}

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service
  onAddToBundle: (service: Service & { customization: ServiceCustomization }) => void
  setIsCartOpen: (isOpen: boolean) => void
}

interface ServiceCustomization {
  notes: string
  preferredDate: string
  preferredTime: string
  location: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

const featureAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
}

const containerAnimation = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }
}

const slideUpAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
}

type ModalMode = 'setup' | 'preview' | 'details'

export default function ServiceModal({ isOpen, onClose, service, onAddToBundle, setIsCartOpen }: ServiceModalProps) {
  const [mode, setMode] = useState<ModalMode>('setup')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    customPrice,
    notes,
    preferredDate,
    preferredTime,
    address,
    setCustomPrice,
    setNotes,
    setPreferredDate,
    setPreferredTime,
    setAddress,
    reset
  } = useServiceSetup()

  useEffect(() => {
    if (isOpen) {
      setCustomPrice(service.price.toString())
    } else {
      reset()
    }
  }, [isOpen, service.price, setCustomPrice, reset])

  const getStepNumber = (currentMode: ModalMode): number => {
    switch (currentMode) {
      case 'setup': return 1
      case 'preview': return 2
      case 'details': return 3
      default: return 1
    }
  }

  const isStepComplete = (stepMode: ModalMode): boolean => {
    const currentStep = getStepNumber(mode)
    const targetStep = getStepNumber(stepMode)
    return currentStep > targetStep
  }

  const isCurrentStep = (stepMode: ModalMode): boolean => {
    return mode === stepMode
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    const serviceWithCustomization = {
      ...service,
      price: parseFloat(customPrice),
      customization: {
        notes: notes,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        location: address,
      },
    }
    
    onAddToBundle(serviceWithCustomization)
    setIsSubmitting(false)
    onClose()
    setIsCartOpen(true)
  }

  const isFormValid = () => {
    return (
      parseFloat(customPrice) > 0 &&
      preferredDate &&
      preferredTime &&
      address.street.trim() !== "" &&
      address.city.trim() !== "" &&
      address.state.trim() !== "" &&
      address.zipCode.trim() !== ""
    )
  }

  const handleSetupSubmit = () => {
    if (parseFloat(customPrice) > 0) {
      setMode('preview')
    }
  }

  const handlePreviewSubmit = () => {
    setMode('details')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/80 z-50">
        <DialogContent className={cn(
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full p-0 overflow-hidden bg-white shadow-xl border-0",
          mode === 'setup' ? 'max-w-lg rounded-3xl' : 'max-w-6xl rounded-3xl'
        )}>
          <DialogHeader className="relative">
            <DialogTitle className="sr-only">Service Customization</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <motion.div
            variants={containerAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent"
          >
            {mode === 'setup' ? (
              // Setup Mode (Price Selection)
              <div className="relative">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(59,130,246,0.03),_transparent_70%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(59,130,246,0.02),_transparent_70%)]" />
                </div>
                
                {/* Header */}
                <div className="px-12 pt-16 pb-10 text-center relative">
                  <motion.div
                    variants={slideUpAnimation}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 mb-8"
                  >
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {service.category}
                    </span>
                  </motion.div>
                  
                  <motion.h2 
                    variants={slideUpAnimation}
                    className="text-3xl font-bold text-gray-900 mb-4"
                  >
                    {service.title}
                  </motion.h2>
                  
                  <motion.p
                    variants={slideUpAnimation}
                    className="text-gray-600 max-w-md mx-auto text-lg"
                  >
                    Please select your preferred price for this service
                  </motion.p>
                </div>

                {/* Price Input */}
                <div className="px-12 pb-12">
                  <div className="max-w-md mx-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-base font-medium text-gray-700">Service Price</label>
                        <span className="text-base font-medium text-blue-600">
                          Starting from ${service.price}
                        </span>
                      </div>
                      <div className="relative group">
                        <div className="relative bg-white rounded-2xl border border-gray-200 group-hover:border-blue-200 shadow-sm transition-all duration-200 group-hover:shadow-[0_0_0_1px_rgba(59,130,246,0.1),0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
                          <div className="absolute inset-y-0 left-0 w-16 bg-blue-50 flex items-center justify-center border-r border-gray-200 group-hover:border-blue-100 group-hover:bg-blue-50/80 transition-colors">
                            <DollarSign className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          </div>
                          <Input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className={cn(
                              "pl-16 bg-transparent border-0 ring-0 focus:ring-0 h-14 text-xl font-medium text-gray-900 placeholder:text-gray-400",
                              !customPrice && "placeholder:text-red-400"
                            )}
                            placeholder="Enter price"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-12 py-6 bg-gray-50 border-t border-gray-100">
                  <div className="max-w-md mx-auto flex items-center justify-end gap-4">
                    <Button
                      onClick={handleSetupSubmit}
                      type="button"
                      disabled={!parseFloat(customPrice) || parseFloat(customPrice) <= 0}
                      className={cn(
                        "relative inline-flex items-center justify-center bg-blue-600 text-white gap-2 px-8 h-11 rounded-xl transition-all",
                        "hover:bg-blue-700 active:bg-blue-800",
                        "disabled:opacity-50 disabled:pointer-events-none",
                        "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      )}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : mode === 'preview' ? (
              <div className="relative">
                {/* Header */}
                <div className="relative h-[360px] bg-blue-50 overflow-hidden rounded-t-3xl">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(59,130,246,0.08),_transparent_70%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(59,130,246,0.05),_transparent_70%)]" />
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center px-12">
                    <motion.div 
                      variants={slideUpAnimation}
                      className="w-full max-w-4xl mx-auto text-center"
                    >
                      <motion.div
                        variants={slideUpAnimation}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-100 mb-8"
                      >
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {service.category}
                        </span>
                      </motion.div>
                      
                      <motion.h2 
                        variants={slideUpAnimation}
                        className="text-4xl font-bold text-gray-900 mb-6"
                      >
                        {service.title}
                      </motion.h2>
                      
                      <motion.p
                        variants={slideUpAnimation}
                        className="text-gray-600 text-lg max-w-2xl mx-auto"
                      >
                        {service.description}
                      </motion.p>
                    </motion.div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-12 py-12 bg-white">
                  <div className="max-w-4xl mx-auto space-y-12">
                    {/* Features Grid */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        What's Included
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {service.features?.map((feature, index) => (
                          <motion.div
                            key={index}
                            variants={featureAnimation}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-6 rounded-2xl bg-gray-50 hover:bg-blue-50/50 transition-all duration-200"
                          >
                            <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-blue-600 group-hover:text-blue-700 transition-colors">
                                <Check className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                                  {feature}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white/80 border-t border-gray-200 backdrop-blur-sm">
                  <div className="max-w-4xl mx-auto px-12 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <div>
                          <span className="text-sm font-medium text-gray-500 block mb-1">Selected price</span>
                          <div className="flex items-baseline gap-1">
                            <button
                              type="button"
                              onClick={() => setMode('setup')}
                              className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg px-2 -mx-2"
                            >
                              ${customPrice}
                            </button>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handlePreviewSubmit}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white gap-2 px-8 h-11 rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(59,130,246,0.25)] transition-all duration-200"
                      >
                        Continue to Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Details Mode
              <div className="relative">
                {/* Header */}
                <div className="px-12 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        onClick={() => setMode('preview')}
                        className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 h-10 px-4 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Preview
                      </Button>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{service.title}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500">{service.category}</p>
                          <span className="text-gray-300">•</span>
                          <button
                            type="button"
                            onClick={() => setMode('setup')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg px-2 py-1 -mx-2"
                          >
                            ${customPrice}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="px-12 py-10 bg-white">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-6 mb-12">
                      {[
                        { mode: 'setup' as ModalMode, label: 'Setup' },
                        { mode: 'preview' as ModalMode, label: 'Preview' },
                        { mode: 'details' as ModalMode, label: 'Details' }
                      ].map((step, index) => (
                        <div key={step.label} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <motion.div 
                              animate={{
                                scale: isCurrentStep(step.mode) ? 1.1 : 1,
                                backgroundColor: isCurrentStep(step.mode)
                                  ? "#2563EB"
                                  : isStepComplete(step.mode)
                                  ? "#1D4ED8"
                                  : "#f3f4f6"
                              }}
                              className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-medium transition-all duration-200 shadow-sm",
                                isCurrentStep(step.mode) || isStepComplete(step.mode)
                                  ? "text-white"
                                  : "text-gray-600"
                              )}
                            >
                              {index + 1}
                            </motion.div>
                            <span className="text-sm font-medium text-gray-600 mt-3">
                              {step.label}
                            </span>
                          </div>
                          {index < 2 && (
                            <div className="w-32 h-[2px] mx-4 bg-gray-100 relative">
                              <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ 
                                  width: isStepComplete(step.mode) ? "100%" : "0%"
                                }}
                                className="absolute inset-0 bg-blue-600 transition-all duration-300"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Form Content */}
                    <div className="space-y-8">
                      <AnimatePresence mode="wait">
                        <motion.div
                          variants={slideUpAnimation}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="space-y-8"
                        >
                          {/* Date and Time */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                Preferred Date
                              </label>
                              <Input
                                type="date"
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                className={cn(
                                  "bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 h-11 rounded-2xl shadow-sm transition-all duration-200 hover:border-gray-300",
                                  !preferredDate && "border-red-200"
                                )}
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                </div>
                                Preferred Time
                              </label>
                              <Input
                                type="time"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className={cn(
                                  "bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 h-11 rounded-2xl shadow-sm transition-all duration-200 hover:border-gray-300",
                                  !preferredTime && "border-red-200"
                                )}
                              />
                            </div>
                          </div>

                          {/* Location */}
                          <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </div>
                              Service Location
                            </label>
                            <div className="space-y-4">
                              <Input
                                type="text"
                                value={address.street}
                                onChange={(e) => setAddress({ street: e.target.value })}
                                placeholder="Street Address"
                                className={cn(
                                  "bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 h-11 rounded-2xl shadow-sm transition-all duration-200 hover:border-gray-300",
                                  !address.street && "border-red-200"
                                )}
                              />
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  { value: address.city, onChange: (v: string) => setAddress({ city: v }), placeholder: "City" },
                                  { value: address.state, onChange: (v: string) => setAddress({ state: v }), placeholder: "State" },
                                  { value: address.zipCode, onChange: (v: string) => setAddress({ zipCode: v }), placeholder: "ZIP Code" }
                                ].map((field, index) => (
                                  <Input
                                    key={field.placeholder}
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder={field.placeholder}
                                    className={cn(
                                      "bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 h-11 rounded-2xl shadow-sm transition-all duration-200 hover:border-gray-300",
                                      !field.value && "border-red-200"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              Additional Notes
                            </label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Any specific requirements or preferences..."
                              className="min-h-[120px] bg-white border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 rounded-2xl resize-none shadow-sm transition-all duration-200 hover:border-gray-300"
                            />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white/80 border-t border-gray-200 backdrop-blur-sm">
                  <div className="max-w-3xl mx-auto px-12 py-6">
                    <div className="flex items-center justify-end gap-4">
                      <div /> {/* Spacer */}
                      <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isSubmitting}
                        className={cn(
                          "inline-flex items-center justify-center bg-blue-600 text-white gap-2 px-8 h-11 rounded-xl transition-colors",
                          "hover:bg-blue-700 active:bg-blue-800",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                        )}
                      >
                        {isSubmitting ? (
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Add to Bundle
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </div>
    </Dialog>
  )
} 