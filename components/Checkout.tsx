'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X, Calendar, Clock, MapPin, CreditCard, Building2, Truck, FileText, PenLine, Banknote, BanknoteIcon, FileCheck, User, Loader2, Wrench, Package } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SignaturePad from 'react-signature-canvas'
import type SignaturePadType from 'react-signature-canvas'
import { toast } from 'sonner'

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
    is_service?: boolean;
    is_custom?: boolean;
  }>;
  onClose: () => void;
  onSubmit: (data: CheckoutFormData) => void;
  installationPrice?: number;
  clearCart: () => void;
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

const calculateTax = (products: Array<{
  id: number;
  title: string;
  price: number;
  quantity: number;
  category: string;
  is_service?: boolean;
  is_custom?: boolean;
}>) => {
  // Only calculate tax for non-service items
  const taxableAmount = products
    .filter(product => 
      !product.is_service && 
      !product.is_custom && 
      product.category !== 'Services' && 
      product.category !== 'Services/Custom' && 
      !product.title.toLowerCase().includes('service') &&
      !product.title.toLowerCase().includes('training') &&
      !product.title.toLowerCase().includes('support') &&
      !product.title.toLowerCase().includes('maintenance') &&
      !product.title.toLowerCase().includes('optimization')
    )
    .reduce((sum, p) => sum + p.price * p.quantity, 0);
  return taxableAmount * TAX_RATE;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Add validation helper functions
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string) => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

const validateZip = (zip: string) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

export default function Checkout({ products, onClose, onSubmit, installationPrice = 0, clearCart }: CheckoutProps) {
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Get active steps based on whether installation is selected
  const activeSteps = steps.filter(step => 
    !step.showWhen || step.showWhen(installationPrice)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep = (stepId: string): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (stepId) {
      case 'contact':
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone number format';
        break;

      case 'shipping':
        if (!formData.shippingAddress.trim()) newErrors.shippingAddress = 'Shipping address is required';
        if (!formData.shippingCity.trim()) newErrors.shippingCity = 'City is required';
        if (!formData.shippingState.trim()) newErrors.shippingState = 'State is required';
        if (!formData.shippingZip.trim()) newErrors.shippingZip = 'ZIP code is required';
        else if (!validateZip(formData.shippingZip)) newErrors.shippingZip = 'Invalid ZIP code format';
        break;

      case 'payment':
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
        break;

      case 'installation':
        if (installationPrice > 0) {
          if (!formData.installationAddress.trim()) newErrors.installationAddress = 'Installation address is required';
          if (!formData.installationCity.trim()) newErrors.installationCity = 'City is required';
          if (!formData.installationState.trim()) newErrors.installationState = 'State is required';
          if (!formData.installationZip.trim()) newErrors.installationZip = 'ZIP code is required';
          else if (!validateZip(formData.installationZip)) newErrors.installationZip = 'Invalid ZIP code format';
          if (!formData.installationDate) newErrors.installationDate = 'Installation date is required';
          if (!formData.installationTime) newErrors.installationTime = 'Installation time is required';
          if (!formData.contactOnSite.trim()) newErrors.contactOnSite = 'On-site contact name is required';
          if (!formData.contactOnSitePhone.trim()) newErrors.contactOnSitePhone = 'On-site contact phone is required';
          else if (!validatePhone(formData.contactOnSitePhone)) newErrors.contactOnSitePhone = 'Invalid phone number format';
        }
        break;

      case 'review':
        if (!formData.signature) newErrors.signature = 'Please sign the contract to proceed';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepId = activeSteps[currentStep]?.id;
    if (!currentStepId) return;

    if (validateStep(currentStepId)) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const currentStepId = activeSteps[currentStep]?.id;
    if (!currentStepId) return;

    if (validateStep(currentStepId)) {
      if (currentStep === activeSteps.length - 1) {
        setIsLoading(true);
        try {
          await onSubmit(formData);
          clearCart();
          onClose();
          toast.success("Order completed successfully!");
        } catch (error) {
          console.error('Error submitting form:', error);
          setErrors({ submit: 'Failed to submit the form. Please try again.' });
          toast.error("Failed to complete order. Please try again.");
        } finally {
          setIsLoading(false);
        }
      } else {
        handleNext();
      }
    }
  };

  // Get current step index based on active steps
  const getCurrentStepIndex = () => {
    if (!installationPrice && currentStep > 0) {
      return currentStep + 1
    }
    return currentStep
  }

  const productsTax = calculateTax(products);
  const total = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  ) + productsTax + installationPrice;

  const handleStepClick = (index: number) => {
    // Only allow clicking on previous steps
    if (index < currentStep) {
      setCurrentStep(index);
      setErrors({});
    }
  };

  const renderStep = () => {
    const currentStepId = activeSteps[currentStep]?.id;

    switch (currentStepId) {
      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full ${errors.firstName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full ${errors.lastName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <Input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
                required
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
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
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              {/* Street Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Street Address
                </label>
                <Input
                  type="text"
                  name="shippingAddress"
                  placeholder="Enter your street address"
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  className={`w-full transition-all ${
                    errors.shippingAddress 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200'
                  }`}
                  required
                />
                {errors.shippingAddress && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="inline-block rounded-full bg-red-100 p-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.shippingAddress}
                  </p>
                )}
              </div>

              {/* City, State, ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    City
                  </label>
                  <Input
                    type="text"
                    name="shippingCity"
                    placeholder="Enter city"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    className={`w-full transition-all ${
                      errors.shippingCity 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200'
                    }`}
                    required
                  />
                  {errors.shippingCity && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="inline-block rounded-full bg-red-100 p-1">
                        <X className="h-3 w-3" />
                      </span>
                      {errors.shippingCity}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    State
                  </label>
                  <Input
                    type="text"
                    name="shippingState"
                    placeholder="Enter state"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    className={`w-full transition-all ${
                      errors.shippingState 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200'
                    }`}
                    required
                  />
                  {errors.shippingState && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="inline-block rounded-full bg-red-100 p-1">
                        <X className="h-3 w-3" />
                      </span>
                      {errors.shippingState}
                    </p>
                  )}
                </div>

                {/* ZIP Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    ZIP Code
                  </label>
                  <Input
                    type="text"
                    name="shippingZip"
                    placeholder="Enter ZIP code"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    className={`w-full transition-all ${
                      errors.shippingZip 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200'
                    }`}
                    required
                  />
                  {errors.shippingZip && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="inline-block rounded-full bg-red-100 p-1">
                        <X className="h-3 w-3" />
                      </span>
                      {errors.shippingZip}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-400" />
                  Delivery Instructions
                  <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </label>
                <Textarea
                  name="shippingInstructions"
                  placeholder="Add any special instructions for delivery (e.g., gate code, preferred entrance, etc.)"
                  value={formData.shippingInstructions}
                  onChange={handleInputChange}
                  className="w-full h-24 resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
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
                className={`w-full ${errors.installationAddress ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationAddress && <p className="text-red-500 text-sm mt-1">{errors.installationAddress}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="installationCity"
                placeholder="City"
                value={formData.installationCity}
                onChange={handleInputChange}
                className={`w-full ${errors.installationCity ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationCity && <p className="text-red-500 text-sm mt-1">{errors.installationCity}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="installationState"
                placeholder="State"
                value={formData.installationState}
                onChange={handleInputChange}
                className={`w-full ${errors.installationState ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationState && <p className="text-red-500 text-sm mt-1">{errors.installationState}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="installationZip"
                placeholder="ZIP Code"
                value={formData.installationZip}
                onChange={handleInputChange}
                className={`w-full ${errors.installationZip ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationZip && <p className="text-red-500 text-sm mt-1">{errors.installationZip}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                className={`w-full ${errors.installationDate ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationDate && <p className="text-red-500 text-sm mt-1">{errors.installationDate}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                name="installationTime"
                value={formData.installationTime}
                onChange={handleInputChange}
                className={`w-full ${errors.installationTime ? 'border-red-500' : ''}`}
                required
              />
              {errors.installationTime && <p className="text-red-500 text-sm mt-1">{errors.installationTime}</p>}
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
                className={`w-full ${errors.contactOnSite ? 'border-red-500' : ''}`}
                required
              />
              {errors.contactOnSite && <p className="text-red-500 text-sm mt-1">{errors.contactOnSite}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="tel"
                name="contactOnSitePhone"
                placeholder="On-site Contact Phone"
                value={formData.contactOnSitePhone}
                onChange={handleInputChange}
                className={`w-full ${errors.contactOnSitePhone ? 'border-red-500' : ''}`}
                required
              />
              {errors.contactOnSitePhone && <p className="text-red-500 text-sm mt-1">{errors.contactOnSitePhone}</p>}
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Contract Review</h3>
                  <p className="text-sm text-gray-500 mt-1">Please review your order details and sign to complete</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  Contract #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>
              
              {/* Contract Document */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Contract Header */}
                <div className="bg-gradient-to-b from-gray-50 to-white p-8 border-b text-center">
                  <div className="max-w-[200px] mx-auto mb-4">
                    {/* You can add your logo here */}
                    <h4 className="text-xl font-bold text-gray-900">Way of Glory Media</h4>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sales & Service Agreement</h2>
                  <p className="text-sm text-gray-600">Generated on {formatDate(new Date())}</p>
                </div>

                {/* Contract Body */}
                <div className="p-8 space-y-8">
                  {/* Customer & Shipping Info */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <User className="h-4 w-4" />
                        Customer Information
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                        <p><span className="text-gray-600">Name:</span> {formData.firstName} {formData.lastName}</p>
                        <p><span className="text-gray-600">Email:</span> {formData.email}</p>
                        <p><span className="text-gray-600">Phone:</span> {formData.phone}</p>
                        {formData.organization && (
                          <p><span className="text-gray-600">Organization:</span> {formData.organization}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <MapPin className="h-4 w-4" />
                        Shipping Information
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                        <p>{formData.shippingAddress}</p>
                        <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZip}</p>
                        {formData.shippingInstructions && (
                          <p className="mt-3 text-gray-600 italic text-sm border-t border-gray-200 pt-2">
                            Note: {formData.shippingInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Package className="h-4 w-4" />
                      Order Summary
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-gray-600 font-medium">Item</th>
                            <th className="px-4 py-3 text-center text-gray-600 font-medium">Quantity</th>
                            <th className="px-4 py-3 text-right text-gray-600 font-medium">Price</th>
                            <th className="px-4 py-3 text-right text-gray-600 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {products.map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">{product.title}</td>
                              <td className="px-4 py-3 text-center">{product.quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(product.price)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.price * product.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-medium">
                          <tr className="border-t border-gray-200">
                            <td colSpan={3} className="px-4 py-2 text-right">Subtotal:</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(products.reduce((sum, p) => sum + p.price * p.quantity, 0))}</td>
                          </tr>
                          {installationPrice > 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-right">Installation:</td>
                              <td className="px-4 py-2 text-right">{formatCurrency(installationPrice)}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right">Tax:</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(productsTax)}</td>
                          </tr>
                          <tr className="border-t border-gray-200 text-lg">
                            <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total:</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Installation Details if applicable */}
                  {installationPrice > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Wrench className="h-4 w-4" />
                        Installation Details
                      </div>
                      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-600 mb-1">Schedule</p>
                              <p className="font-medium">{formData.installationDate}</p>
                              <p className="font-medium">{formData.installationTime}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">On-site Contact</p>
                              <p className="font-medium">{formData.contactOnSite}</p>
                              <p className="font-medium">{formData.contactOnSitePhone}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-600 mb-1">Installation Location</p>
                              <p className="font-medium">{formData.installationAddress}</p>
                              <p className="font-medium">{formData.installationCity}, {formData.installationState} {formData.installationZip}</p>
                            </div>
                            {formData.accessInstructions && (
                              <div>
                                <p className="text-gray-600 mb-1">Access Instructions</p>
                                <p className="italic">{formData.accessInstructions}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <FileText className="h-4 w-4" />
                      Terms and Conditions
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 text-sm space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        By signing this agreement, you acknowledge and agree to the following terms:
                      </p>
                      <div className="space-y-3 text-gray-600">
                        <p>1. <strong>Payment Terms:</strong> Payment is due according to the selected payment method. For invoiced orders, payment is due within 30 days of the invoice date.</p>
                        <p>2. <strong>Installation:</strong> If installation services are included, the customer agrees to provide access to the premises at the scheduled date and time.</p>
                        <p>3. <strong>Warranty:</strong> All products come with manufacturer's warranty. Services are guaranteed for quality and workmanship.</p>
                        <p>4. <strong>Cancellation:</strong> Orders may be cancelled within 24 hours of placement without penalty. Custom services may not be eligible for cancellation.</p>
                        <p>5. <strong>Returns:</strong> Products may be returned within 30 days in original condition. Custom items and services are non-refundable.</p>
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <PenLine className="h-4 w-4" />
                      Electronic Signature
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600 mb-6">
                        By signing below, I acknowledge that I have read and agree to the terms and conditions outlined in this contract.
                        I understand that this electronic signature is legally binding.
                      </p>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <SignaturePad
                          ref={signaturePadRef}
                          canvasProps={{
                            className: 'w-full h-48 bg-white rounded-lg border border-gray-200 shadow-inner',
                          }}
                          onEnd={() => {
                            const dataUrl = signaturePadRef.current?.toDataURL() || null;
                            setFormData(prev => ({ ...prev, signature: dataUrl }));
                          }}
                        />
                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                          <div className="text-sm text-gray-500">
                            {formData.signature ? (
                              <>
                                <p className="font-medium text-gray-900">Signed by: {formData.firstName} {formData.lastName}</p>
                                <p className="text-xs">on {formatDate(new Date())}</p>
                              </>
                            ) : (
                              <p>Please sign above to complete the contract</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
                      {errors.signature && (
                        <p className="mt-4 text-sm text-red-600 flex items-center gap-2">
                          <X className="h-4 w-4" />
                          {errors.signature}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  const isClickable = index < currentStep;
                  
                  return (
                    <div key={step.id} className="flex-1 flex items-center">
                      <div 
                        className={`flex flex-col items-center flex-1 ${isClickable ? 'cursor-pointer' : ''}`}
                        onClick={() => isClickable && handleStepClick(index)}
                      >
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                              : isCompleted
                                ? 'bg-blue-600 text-white hover:ring-4 hover:ring-blue-100'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <StepIcon className="h-6 w-6" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className={`text-sm font-medium ${
                            isActive 
                              ? 'text-blue-600' 
                              : isCompleted
                                ? 'text-gray-900 hover:text-blue-600'
                                : 'text-gray-900'
                          }`}>
                            {step.title}
                          </div>
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
                  );
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