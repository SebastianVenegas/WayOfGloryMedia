import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, DollarSign, FileText, X, ArrowRight, CheckCircle, Info, Package, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export default function ServiceModal({ isOpen, onClose, service, onAddToBundle, setIsCartOpen }: ServiceModalProps) {
  const [customPrice, setCustomPrice] = useState(service.price.toString())
  const [notes, setNotes] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zipCode: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleSubmit = () => {
    setIsSubmitting(true)
    const serviceWithCustomization = {
      ...service,
      price: parseFloat(customPrice),
      customization: {
        notes,
        preferredDate,
        preferredTime,
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

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-2xl p-0 overflow-hidden bg-white shadow-2xl border-0 rounded-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            <DialogHeader className="p-0">
              <div className="relative h-56 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.15),_transparent_50%)]" />
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
                  
                  {/* Animated Background Elements */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                      scale: [1, 1.2, 1],
                      rotate: [0, 90, 0]
                    }}
                    transition={{ 
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: [0.2, 0.4, 0.2],
                      scale: [1, 1.1, 1],
                      rotate: [0, -90, 0]
                    }}
                    transition={{ 
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
                  />
                  
                  {/* Grid Pattern */}
                  <div 
                    className="absolute inset-0 opacity-[0.02]" 
                    style={{
                      backgroundImage: `radial-gradient(circle at center, white 1px, transparent 1px)`,
                      backgroundSize: '24px 24px'
                    }}
                  />
                </div>

                {/* Content */}
                <div className="px-12 py-10 relative z-10 text-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center justify-center gap-4 mb-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg transform hover:scale-105 transition-transform">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <motion.span 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium tracking-wide shadow-lg"
                    >
                      {service.category}
                    </motion.span>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <DialogTitle className="text-4xl font-bold mb-4 text-white tracking-tight">
                      {service.title}
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                      {service.description}
                    </DialogDescription>
                  </motion.div>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-6 top-6 text-white hover:bg-white/20 rounded-full h-10 w-10 shadow-lg transition-all backdrop-blur-sm"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="px-10 py-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      currentStep === 1 
                        ? "bg-blue-500 text-white shadow-md" 
                        : "bg-blue-50 text-blue-500"
                    )}
                  >
                    1
                  </div>
                  <div className="w-16 h-0.5 bg-blue-50">
                    <div 
                      className={cn(
                        "h-full bg-blue-500 transition-all duration-300",
                        currentStep === 2 ? "w-full" : "w-0"
                      )} 
                    />
                  </div>
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      currentStep === 2 
                        ? "bg-blue-500 text-white shadow-md" 
                        : "bg-blue-50 text-blue-500"
                    )}
                  >
                    2
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {currentStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {/* Features Section */}
                    {service.features && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8"
                      >
                        <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                          Service Features & Benefits
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <AnimatePresence>
                            {service.features.map((feature, index) => (
                              <motion.div
                                key={index}
                                variants={featureAnimation}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ 
                                  duration: 0.2,
                                  delay: index * 0.05,
                                  ease: "easeOut"
                                }}
                                className="flex items-start gap-4 p-4 rounded-xl bg-white hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-md group"
                              >
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                                  <Check className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="text-base text-gray-600 group-hover:text-gray-900">{feature}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}

                    {/* Price Input with better visual feedback */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2.5">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Service Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">$</span>
                        <Input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className={cn(
                            "pl-9 bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all h-12 rounded-xl text-lg shadow-sm font-medium",
                            !customPrice && "border-red-200 focus:border-red-400 focus:ring-red-50"
                          )}
                          placeholder="Enter service price"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Info Box */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 via-blue-50 to-white border border-blue-100 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-blue-900 mb-1">Schedule Your Service</h4>
                        <p className="text-sm text-blue-700/90 leading-relaxed">Please provide your preferred date, time, and location for the service.</p>
                      </div>
                    </div>

                    {/* Date and Time Grid */}
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2.5">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          Preferred Date
                        </label>
                        <Input
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className={cn(
                            "w-full bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                            !preferredDate && "border-red-200 focus:border-red-400"
                          )}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2.5">
                          <Clock className="h-5 w-5 text-blue-500" />
                          Preferred Time
                        </label>
                        <Input
                          type="time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className={cn(
                            "w-full bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                            !preferredTime && "border-red-200 focus:border-red-400"
                          )}
                        />
                      </div>
                    </div>

                    {/* Location Input */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <h4 className="text-sm font-medium text-gray-700">Service Location</h4>
                      </div>
                      
                      <div className="grid gap-5">
                        <div className="space-y-3">
                          <label className="text-sm text-gray-600">Street Address</label>
                          <Input
                            type="text"
                            value={address.street}
                            onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                            placeholder="Enter street address"
                            className={cn(
                              "bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                              !address.street && "border-red-200 focus:border-red-400"
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-sm text-gray-600">City</label>
                            <Input
                              type="text"
                              value={address.city}
                              onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="City"
                              className={cn(
                                "bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                                !address.city && "border-red-200 focus:border-red-400"
                              )}
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm text-gray-600">State</label>
                            <Input
                              type="text"
                              value={address.state}
                              onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                              placeholder="State"
                              className={cn(
                                "bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                                !address.state && "border-red-200 focus:border-red-400"
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm text-gray-600">ZIP Code</label>
                          <Input
                            type="text"
                            value={address.zipCode}
                            onChange={(e) => setAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                            placeholder="ZIP Code"
                            className={cn(
                              "bg-white border-gray-200 focus:border-blue-300 transition-all h-11 rounded-xl shadow-sm",
                              !address.zipCode && "border-red-200 focus:border-red-400"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Notes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2.5">
                          <FileText className="h-5 w-5 text-blue-500" />
                          Additional Notes
                        </label>
                        <span className="text-xs text-gray-500">
                          {notes.length > 0 ? `${notes.length} characters` : 'Optional'}
                        </span>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any specific requirements or special instructions..."
                          className="min-h-[120px] bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none text-sm rounded-xl p-4 shadow-sm"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
                          {notes.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 border border-blue-100"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-xs text-blue-700 font-medium">Saved</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Notes are automatically saved and will be attached to your service bundle.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-10 py-6 bg-gradient-to-b from-transparent to-gray-50/80 border-t border-gray-100"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentStep === 2 && !isFormValid() && (
                    <span className="text-sm text-red-500 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Please complete all required fields
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {currentStep === 2 && (
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 h-11 px-5 rounded-xl"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep === 1 ? (
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 min-w-[140px] h-11 rounded-xl shadow-lg"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!isFormValid() || isSubmitting}
                      className={cn(
                        "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 min-w-[180px] h-11 rounded-xl shadow-lg transition-all",
                        isSubmitting && "cursor-not-allowed opacity-80"
                      )}
                    >
                      {isSubmitting ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-blue-500"
                        >
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <>
                          Add to Bundle
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </DialogContent>
      </div>
    </Dialog>
  )
} 