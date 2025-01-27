'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X, Calendar, Clock, MapPin, CreditCard, Building2, Truck, FileText, PenLine, Banknote, BanknoteIcon, FileCheck, User, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SignaturePad from 'react-signature-canvas'
import type SignaturePadType from 'react-signature-canvas'

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingInstructions: string;
  installationAddress: string;
  installationCity: string;
  installationState: string;
  installationZip: string;
  installationDate: string;
  installationTime: string;
  accessInstructions: string;
  contactOnSite: string;
  contactOnSitePhone: string;
  paymentMethod: string;
  signature: string | null;
}

interface CheckoutProps {
  products: Array<{
    id: number;
    title: string;
    price: number;
    our_price?: number;
    quantity: number;
    category: string;
  }>;
  onClose: () => void;
  onSubmit: (data: CheckoutFormData) => void;
  installationPrice?: number;
}

const steps = [
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Fill in your contact details',
    icon: User
  },
  {
    id: 'shipping',
    title: 'Shipping Address',
    description: 'Where should we deliver?',
    icon: Truck
  },
  {
    id: 'payment',
    title: 'Payment Method',
    description: 'Choose how to pay',
    icon: CreditCard
  },
  {
    id: 'installation',
    title: 'Installation Details',
    description: 'Setup and installation info',
    icon: MapPin,
    showWhen: (installationPrice: number) => installationPrice > 0
  },
  {
    id: 'review',
    title: 'Review & Sign',
    description: 'Review and sign contract',
    icon: FileText
  }
]

const TAX_RATE = 0.0775; // 7.75% for Riverside, CA

const calculateTax = (price: number) => {
  return price * TAX_RATE;
};

export default function Checkout({ products, onClose, onSubmit, installationPrice = 0 }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingInstructions: '',
    installationAddress: '',
    installationCity: '',
    installationState: '',
    installationZip: '',
    installationDate: '',
    installationTime: '',
    accessInstructions: '',
    contactOnSite: '',
    contactOnSitePhone: '',
    paymentMethod: '',
    signature: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const signaturePadRef = useRef<SignaturePadType>(null)

  // Get active steps based on whether installation is selected
  const activeSteps = steps.filter(step => 
    !step.showWhen || step.showWhen(installationPrice)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    // Validate payment method selection
    if (activeSteps[currentStep]?.id === 'payment' && !formData.paymentMethod) {
      alert('Please select a payment method to continue')
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (currentStep === activeSteps.length - 1) {
      setIsLoading(true)
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    } else {
      handleNext()
    }
  }

  // Get current step index based on active steps
  const getCurrentStepIndex = () => {
    if (!installationPrice && currentStep > 0) {
      return currentStep + 1
    }
    return currentStep
  }

  const productsSubtotal = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  );
  const productsTax = calculateTax(productsSubtotal);
  const total = productsSubtotal + productsTax + installationPrice;

  const renderStep = () => {
    // Get the actual step ID based on current index
    const currentStepId = activeSteps[currentStep]?.id

    switch (currentStepId) {
      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            <Input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            <Input
              type="text"
              name="organization"
              placeholder="Organization (optional)"
              value={formData.organization}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Information</h3>
            <Input
              type="text"
              name="shippingAddress"
              placeholder="Street Address"
              value={formData.shippingAddress}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="shippingCity"
                placeholder="City"
                value={formData.shippingCity}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="text"
                name="shippingState"
                placeholder="State"
                value={formData.shippingState}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <Input
              type="text"
              name="shippingZip"
              placeholder="ZIP Code"
              value={formData.shippingZip}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            <Textarea
              name="shippingInstructions"
              placeholder="Delivery Instructions (optional)"
              value={formData.shippingInstructions}
              onChange={handleInputChange}
              className="w-full h-24"
            />
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Select Payment Method</h3>
            <div className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
              >
                <div className="flex items-center gap-3">
                  <BanknoteIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Cash</h4>
                    <p className="text-sm text-gray-600">Pay in cash before delivery</p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'check' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'check' }))}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Check</h4>
                    <p className="text-sm text-gray-600">Pay by check before delivery</p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'direct_deposit' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'direct_deposit' }))}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium">Direct Deposit</h4>
                    <p className="text-sm text-gray-600">Pay via bank transfer</p>
                  </div>
                </div>
                {formData.paymentMethod === 'direct_deposit' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Bank Details:</h5>
                    <div className="space-y-1 text-sm">
                      <p>Bank: Chase Bank</p>
                      <p>Account Name: Way of Glory Media INC</p>
                      <p>Account Number: XXXX-XXXX-XXXX</p>
                      <p>Routing Number: XXXXXXXX</p>
                      <p className="mt-2 text-gray-600">Please include your name and event date in the transfer description</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'installation':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Installation Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="installationAddress"
                placeholder="Installation Address"
                value={formData.installationAddress}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="text"
                name="installationCity"
                placeholder="City"
                value={formData.installationCity}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="installationState"
                placeholder="State"
                value={formData.installationState}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="text"
                name="installationZip"
                placeholder="ZIP Code"
                value={formData.installationZip}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="time"
                name="installationTime"
                value={formData.installationTime}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <Textarea
              name="accessInstructions"
              placeholder="Access Instructions"
              value={formData.accessInstructions}
              onChange={handleInputChange}
              className="w-full h-24"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="contactOnSite"
                placeholder="On-site Contact Name"
                value={formData.contactOnSite}
                onChange={handleInputChange}
                className="w-full"
                required
              />
              <Input
                type="tel"
                name="contactOnSitePhone"
                placeholder="On-site Contact Phone"
                value={formData.contactOnSitePhone}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contract Overview</h3>
              
              {/* Contact Information */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-gray-600">Name:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="text-gray-600">Email:</span> {formData.email}</p>
                  <p><span className="text-gray-600">Phone:</span> {formData.phone}</p>
                  {formData.organization && (
                    <p><span className="text-gray-600">Organization:</span> {formData.organization}</p>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Shipping Information</h4>
                <div className="space-y-1 text-sm">
                  <p>{formData.shippingAddress}</p>
                  <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZip}</p>
                  {formData.shippingInstructions && (
                    <p className="mt-2"><span className="text-gray-600">Instructions:</span> {formData.shippingInstructions}</p>
                  )}
                </div>
              </div>

              {/* Installation Details */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Installation Details</h4>
                <div className="space-y-1 text-sm">
                  <p>{formData.installationAddress}</p>
                  <p>{formData.installationCity}, {formData.installationState} {formData.installationZip}</p>
                  <p><span className="text-gray-600">Date:</span> {formData.installationDate}</p>
                  <p><span className="text-gray-600">Time:</span> {formData.installationTime}</p>
                  <p><span className="text-gray-600">On-site Contact:</span> {formData.contactOnSite}</p>
                  <p><span className="text-gray-600">Contact Phone:</span> {formData.contactOnSitePhone}</p>
                  {formData.accessInstructions && (
                    <p className="mt-2"><span className="text-gray-600">Access Instructions:</span> {formData.accessInstructions}</p>
                  )}
                </div>
              </div>

              {/* Equipment & Payment */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Equipment & Payment</h4>
                <div className="space-y-2">
                  <div className="text-sm space-y-1">
                    {products.map((product, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{product.title} (x{product.quantity})</span>
                        <span>${((product.our_price || product.price) * product.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span>Sales Tax</span>
                      <span>${productsTax.toFixed(2)}</span>
                    </div>
                    {installationPrice > 0 && (
                      <div className="flex justify-between">
                        <span>Installation</span>
                        <span>${installationPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 font-medium">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Payment Method: {formData.paymentMethod}</p>
                </div>
              </div>

              {/* Terms and Services */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Terms and Services</h4>
                <div className="space-y-4 text-sm">
                  {/* Equipment Terms - Only show if there are products */}
                  {products.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900">Equipment Terms</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>All equipment remains the property of Santi Sounds</li>
                        <li>Equipment must be returned in the same condition as received</li>
                        <li>Client is responsible for any damage or loss during the rental period</li>
                      </ul>
                    </div>
                  )}

                  {/* Payment Terms - Always show */}
                  <div>
                    <h5 className="font-medium text-gray-900">Payment Terms</h5>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Full payment must be received before equipment delivery</li>
                      <li>A security deposit may be required for certain equipment</li>
                      <li>Cancellation fees may apply if cancelled within 48 hours of the event</li>
                    </ul>
                  </div>

                  {/* Delivery Terms - Show if there are physical products */}
                  {products.some(p => !p.category?.includes('Services')) && (
                    <div>
                      <h5 className="font-medium text-gray-900">Delivery and Setup</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Accurate delivery information must be provided</li>
                        <li>Client or representative must be present during delivery</li>
                        <li>Additional fees may apply for difficult access or extended waiting times</li>
                      </ul>
                    </div>
                  )}

                  {/* Installation Terms - Only show if installation is selected */}
                  {installationPrice > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900">Installation Services</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        <li>Installation area must be prepared and accessible</li>
                        <li>Client must provide necessary power and mounting requirements</li>
                        <li>Any modifications to the installation space must be pre-approved</li>
                        <li>Additional charges may apply for unforeseen installation complications</li>
                      </ul>
                    </div>
                  )}

                  {/* Client Responsibilities - Show if there are products or installation */}
                  {(products.length > 0 || installationPrice > 0) && (
                    <div>
                      <h5 className="font-medium text-gray-900">Client Responsibilities</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        {products.length > 0 && (
                          <>
                            <li>Provide adequate power supply as specified</li>
                            <li>Ensure safe storage of equipment during the rental period</li>
                          </>
                        )}
                        <li>Report any issues immediately</li>
                        {products.length > 0 && (
                          <li>No modifications or repairs to be attempted by the client</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* E-Signature */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">E-Signature</h4>
                <p className="text-sm text-gray-600 mb-4">
                  By signing below, you agree to the terms and conditions outlined in this contract.
                </p>
                <div className="border rounded-lg p-2 bg-gray-50">
                  <SignaturePad
                    ref={signaturePadRef}
                    canvasProps={{
                      className: 'w-full h-40 bg-white rounded border',
                    }}
                    onEnd={() => {
                      const dataUrl = signaturePadRef.current?.toDataURL() || null;
                      setFormData(prev => ({ ...prev, signature: dataUrl }));
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (signaturePadRef.current) {
                      signaturePadRef.current.clear();
                      setFormData(prev => ({ ...prev, signature: null }));
                    }
                  }}
                >
                  Clear Signature
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
    >
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Create Contract</h2>
                <p className="mt-1 text-base text-gray-500">Complete the form below to create your contract</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {activeSteps.map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = index === currentStep
                  const isCompleted = index < currentStep
                  return (
                    <div key={step.id} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isActive 
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                              : isCompleted
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <StepIcon className="h-6 w-6" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>{step.title}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                        </div>
                      </div>
                      {index < activeSteps.length - 1 && (
                        <div className="w-full h-1 bg-gray-200 mx-2">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: isCompleted ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-4">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                onClick={currentStep === 0 ? onClose : handleBack}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <ChevronLeft className="h-5 w-5" />
                {currentStep === 0 ? 'Back' : 'Back'}
              </Button>
              <Button
                type="button"
                onClick={currentStep === activeSteps.length - 1 ? handleSubmit : handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={(currentStep === activeSteps.length - 1 && !formData.signature) || isLoading}
              >
                {currentStep === activeSteps.length - 1 ? (
                  isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Contract...
                    </>
                  ) : (
                    <>
                      Complete Contract
                      <FileText className="h-5 w-5" />
                    </>
                  )
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
} 