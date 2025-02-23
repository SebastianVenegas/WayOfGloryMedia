'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion as m, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X, Calendar, Clock, MapPin, CreditCard, Building2, Truck, FileText, PenLine, Banknote, BanknoteIcon, FileCheck, User, Loader2, Wrench, Package, ClipboardCopy, Info, Phone, CheckCircle2, Shield, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SignaturePad from 'react-signature-canvas'
import type SignaturePadType from 'react-signature-canvas'
import { toast } from 'sonner'
import { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

export interface CheckoutFormData {
  contractNumber: string;
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
  paymentPlan: 'full' | 'installments';
  signature: string | null;
  dueToday: number | null;
  totalDueAfterFirst: number | null;
  numberOfInstallments: number | null;
  installmentAmount: number | null;
  downPayment: number | null;
  order_creator?: string;
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
    description?: string;
    technical_details?: Record<string, string>;
    features?: string[];
    included_items?: string[];
    warranty_info?: string;
    installation_available?: boolean;
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

const calculateTotal = (products: Array<{
  id: number;
  title: string;
  price: number;
  quantity: number;
  category: string;
  is_service?: boolean;
  is_custom?: boolean;
}>, installationPrice: number = 0) => {
  const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const tax = calculateTax(products);
  return subtotal + tax + installationPrice;
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

// First, let's create interfaces for our step components
interface StepProps {
  formData: CheckoutFormData;
  onChange: (data: Partial<CheckoutFormData>) => void;
  errors: { [key: string]: string };
  onSubmit: () => void;
  products: CheckoutProps['products'];
  installationPrice: number;
}

// Extract step components
const ContactStep: React.FC<StepProps> = ({ formData, onChange, errors, onSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

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
            onChange={handleChange}
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
            onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
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
        onChange={handleChange}
              className="w-full"
            />
          </div>
        );
};

const ShippingStep: React.FC<StepProps> = ({ formData, onChange, errors, onSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
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
            onChange={handleChange}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
            onChange={handleChange}
                  className="w-full h-24 resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>
        );
};

const PaymentStep: React.FC<StepProps> = ({ formData, onChange, errors, onSubmit, products, installationPrice }) => {
  const handlePaymentMethodChange = (method: string) => {
    onChange({ paymentMethod: method });
  };

  const handlePaymentPlanChange = (plan: 'full' | 'installments') => {
    onChange({ paymentPlan: plan });
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const total = calculateTotal(products, installationPrice);
    const downPayment = parseFloat(e.target.value) || 0;
    
    if (formData.numberOfInstallments) {
      const remainingBalance = total - downPayment;
      const installmentAmount = remainingBalance / formData.numberOfInstallments;
      
      onChange({
        downPayment,
        installmentAmount,
        dueToday: downPayment,
        totalDueAfterFirst: remainingBalance
      });
    } else {
      onChange({
        downPayment,
        dueToday: downPayment
      });
    }
  };

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const installments = parseInt(e.target.value);
    const total = calculateTotal(products, installationPrice);
    const downPayment = formData.downPayment || total * 0.2; // Use existing down payment or default to 20%
    const remainingBalance = total - downPayment;
    const installmentAmount = Number((remainingBalance / installments).toFixed(2));

    onChange({
      numberOfInstallments: installments,
      downPayment,
      installmentAmount,
      dueToday: downPayment,
      totalDueAfterFirst: remainingBalance
    });
  };

  const total = calculateTotal(products, installationPrice);
  const minDownPayment = total * 0.1; // Minimum 10% down payment

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Method</h3>
        <div className="grid grid-cols-1 gap-4">
          <PaymentOption
            title="Cash"
            description="Pay in cash"
            icon={BanknoteIcon}
            iconColor="text-green-500"
            selected={formData.paymentMethod === 'cash'}
            onClick={() => handlePaymentMethodChange('cash')}
          />
          <PaymentOption
            title="Check"
            description="Pay by check"
            icon={FileCheck}
            iconColor="text-blue-500"
            selected={formData.paymentMethod === 'check'}
            onClick={() => handlePaymentMethodChange('check')}
          />
          <PaymentOption
            title="PayPal"
            description="Pay using PayPal"
            icon={CreditCard}
            iconColor="text-blue-600"
            selected={formData.paymentMethod === 'paypal'}
            onClick={() => handlePaymentMethodChange('paypal')}
          />
          <PaymentOption
            title="Zelle"
            description="Pay using Zelle"
            icon={Building2}
            iconColor="text-purple-500"
            selected={formData.paymentMethod === 'zelle'}
            onClick={() => handlePaymentMethodChange('zelle')}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Plan</h3>
        <div className="grid grid-cols-1 gap-4">
          <PaymentOption
            title="Full Payment"
            description="Pay the entire amount upfront"
            icon={Banknote}
            iconColor="text-green-500"
            selected={formData.paymentPlan === 'full'}
            onClick={() => handlePaymentPlanChange('full')}
          />
          <PaymentOption
            title="Installment Plan"
            description="Split your payment into installments"
            icon={BanknoteIcon}
            iconColor="text-blue-500"
            selected={formData.paymentPlan === 'installments'}
            onClick={() => handlePaymentPlanChange('installments')}
            additionalContent={
              formData.paymentPlan === 'installments' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Down Payment (Minimum {formatCurrency(minDownPayment)})
                    </label>
                    <input
                      type="number"
                      min={minDownPayment}
                      max={total}
                      step="0.01"
                      value={formData.downPayment || ''}
                      onChange={handleDownPaymentChange}
                      className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-900"
                      placeholder="Enter down payment amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Installments
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-900"
                      value={formData.numberOfInstallments || ''}
                      onChange={handleInstallmentChange}
                    >
                      <option value="">Select number of installments</option>
                      <option value="3">3 installments</option>
                      <option value="4">4 installments</option>
                      <option value="6">6 installments</option>
                      <option value="12">12 installments</option>
                    </select>
                  </div>
                  {formData.numberOfInstallments && formData.downPayment && formData.installmentAmount && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="text-sm text-gray-600">
                        Down Payment (Due Today): {formatCurrency(formData.downPayment)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.numberOfInstallments} payments of {formatCurrency(formData.installmentAmount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total After Down Payment: {formatCurrency(formData.totalDueAfterFirst || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Amount: {formatCurrency(total)}
                      </p>
                    </div>
                  )}
                </div>
              )
            }
          />
        </div>
      </div>
    </div>
  );
};

interface PaymentOptionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  selected: boolean;
  onClick: () => void;
  additionalContent?: React.ReactNode;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({
  title,
  description,
  icon: Icon,
  iconColor,
  selected,
  onClick,
  additionalContent
}) => (
  <div 
    className={`p-4 border rounded-lg cursor-pointer transition-all ${
      selected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
            </div>
    </div>
    {additionalContent}
          </div>
        );

const InstallationStep: React.FC<StepProps> = ({ formData, onChange, errors, onSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Installation Details</h3>
      <div className="grid grid-cols-1 gap-4">
              <Input
                type="text"
                name="installationAddress"
                placeholder="Installation Address"
                value={formData.installationAddress}
          onChange={handleChange}
                className={`w-full ${errors.installationAddress ? 'border-red-500' : ''}`}
                required
              />
        {errors.installationAddress && (
          <p className="text-red-500 text-sm">{errors.installationAddress}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                name="installationCity"
                placeholder="City"
                value={formData.installationCity}
            onChange={handleChange}
                className={`w-full ${errors.installationCity ? 'border-red-500' : ''}`}
                required
              />
              <Input
                type="text"
                name="installationState"
                placeholder="State"
                value={formData.installationState}
            onChange={handleChange}
                className={`w-full ${errors.installationState ? 'border-red-500' : ''}`}
                required
              />
              <Input
                type="text"
                name="installationZip"
                placeholder="ZIP Code"
                value={formData.installationZip}
            onChange={handleChange}
                className={`w-full ${errors.installationZip ? 'border-red-500' : ''}`}
                required
              />
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <Input
                type="date"
                name="installationDate"
                value={formData.installationDate}
              onChange={handleChange}
                className={`w-full ${errors.installationDate ? 'border-red-500' : ''}`}
                required
              />
            {errors.installationDate && (
              <p className="text-red-500 text-sm mt-1">{errors.installationDate}</p>
            )}
            </div>
          <div>
              <Input
                type="time"
                name="installationTime"
                value={formData.installationTime}
              onChange={handleChange}
                className={`w-full ${errors.installationTime ? 'border-red-500' : ''}`}
                required
              />
            {errors.installationTime && (
              <p className="text-red-500 text-sm mt-1">{errors.installationTime}</p>
            )}
            </div>
        </div>

            <Textarea
              name="accessInstructions"
              placeholder="Access Instructions"
              value={formData.accessInstructions}
          onChange={handleChange}
              className="w-full h-24"
            />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <Input
                type="text"
                name="contactOnSite"
                placeholder="On-site Contact Name"
                value={formData.contactOnSite}
              onChange={handleChange}
                className={`w-full ${errors.contactOnSite ? 'border-red-500' : ''}`}
                required
              />
            {errors.contactOnSite && (
              <p className="text-red-500 text-sm mt-1">{errors.contactOnSite}</p>
            )}
            </div>
          <div>
              <Input
                type="tel"
                name="contactOnSitePhone"
                placeholder="On-site Contact Phone"
                value={formData.contactOnSitePhone}
              onChange={handleChange}
                className={`w-full ${errors.contactOnSitePhone ? 'border-red-500' : ''}`}
                required
              />
            {errors.contactOnSitePhone && (
              <p className="text-red-500 text-sm mt-1">{errors.contactOnSitePhone}</p>
            )}
          </div>
        </div>
            </div>
          </div>
        );
};

// Add contract number generation utility
const generateContractNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `WGM-${year}${month}-${random}`;
};

// Update ContractHeader component
interface ContractHeaderProps {
  contractNumber: string;
}

const ContractHeader: React.FC<ContractHeaderProps> = ({ contractNumber }) => {
        return (
    <div className="bg-gradient-to-b from-gray-50 to-white p-8 border border-gray-200 rounded-xl">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-[400px] h-[120px] flex items-center justify-center mb-8">
          <Image
            src="/images/logo/LogoLight.png"
            alt="Way of Glory Media Logo"
            width={400}
            height={120}
            className="object-contain"
            priority
          />
                </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Sales & Service Agreement</h2>
        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
          <Calendar className="h-5 w-5" />
          <p className="text-base">{formatDate(new Date())}</p>
                </div>
              </div>
              
      <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
                  </div>
          <div>
            <p className="text-base font-medium text-gray-900">Contract Reference</p>
            <p className="text-sm text-gray-500">Keep this number for your records</p>
                </div>
                      </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-mono bg-white px-6 py-3 rounded-lg border border-gray-200 text-gray-900 font-medium shadow-sm">
            {contractNumber}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg h-12 w-12"
            onClick={() => {
              navigator.clipboard.writeText(contractNumber);
              toast.success('Contract number copied to clipboard');
            }}
          >
            <ClipboardCopy className="h-5 w-5" />
          </Button>
                      </div>
                    </div>
    </div>
  );
};

// Update PaymentPlanSection component
const PaymentPlanSection: React.FC<{ formData: CheckoutFormData; products: CheckoutProps['products']; installationPrice: number }> = ({ formData, products, installationPrice }) => {
  const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const tax = calculateTax(products);
  const total = subtotal + tax + installationPrice;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2.5 rounded-lg">
          <BanknoteIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
      </div>
      <div className="space-y-6">
        {/* Payment Method */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h4>
          <div className="flex items-center gap-2">
            {formData.paymentMethod === 'cash' && <BanknoteIcon className="h-4 w-4 text-green-500" />}
            {formData.paymentMethod === 'check' && <FileCheck className="h-4 w-4 text-blue-500" />}
            {formData.paymentMethod === 'paypal' && <CreditCard className="h-4 w-4 text-blue-600" />}
            {formData.paymentMethod === 'zelle' && <Building2 className="h-4 w-4 text-purple-500" />}
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {formData.paymentMethod.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
            </div>
            
            {formData.paymentPlan === 'installments' ? (
              <>
                <div className="flex justify-between items-center text-blue-600 font-medium">
                  <span className="text-sm">Due Today</span>
                  <span className="text-sm">{formatCurrency(formData.downPayment || 0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Remaining Balance</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(formData.totalDueAfterFirst || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Plan</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formData.numberOfInstallments} payments of {formatCurrency(formData.installmentAmount || 0)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-blue-600 font-medium">
                <span className="text-sm">Full Payment Due Today</span>
                <span className="text-sm">{formatCurrency(total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            {installationPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Installation</span>
                <span className="text-sm text-gray-900">{formatCurrency(installationPrice)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tax</span>
              <span className="text-sm text-gray-900">{formatCurrency(tax)}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-medium">
              <span className="text-sm text-gray-900">Total</span>
              <span className="text-sm text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update ReviewStep component
const ReviewStep: React.FC<StepProps & {
  products: CheckoutProps['products'];
  installationPrice: number;
  signaturePadRef: React.RefObject<SignaturePadType>;
}> = ({
  formData,
  onChange,
  errors,
  products,
  installationPrice,
  signaturePadRef
}) => {
  const productsTax = calculateTax(products);
  const total = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  ) + productsTax + installationPrice;

  return (
    <div className="space-y-8">
      <ContractHeader contractNumber={formData.contractNumber} />
      
      <OrderSummary
        products={products}
        installationPrice={installationPrice}
        productsTax={productsTax}
        total={total}
        formData={formData}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CustomerInformation formData={formData} />
          <ShippingInformation formData={formData} />
        </div>
        <div className="space-y-6">
          <PaymentPlanSection 
            formData={formData} 
            products={products} 
            installationPrice={installationPrice}
          />
          {installationPrice > 0 && (
            <InstallationInformation formData={formData} />
          )}
        </div>
      </div>
      
      <TermsAndConditions />
      
      <SignatureSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        signaturePadRef={signaturePadRef}
      />
    </div>
  );
};

// Update ProductDetailsModal component
const ProductDetailsModal: React.FC<{
  product: CheckoutProps['products'][0] | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  const hasDetails = product.description || 
                    (product.technical_details && Object.keys(product.technical_details).length > 0) ||
                    (product.features && product.features.length > 0) ||
                    (product.included_items && product.included_items.length > 0) ||
                    product.warranty_info;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white p-6 rounded-2xl overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {product.title}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge variant={product.is_service ? "secondary" : "default"}>
                  {product.category}
                </Badge>
                {product.installation_available && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Installation Available
                  </Badge>
                )}
              </div>
            </div>
            <DialogClose className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>

          {/* Price Information */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(Number(product.price))}
              </span>
              <span className="text-sm text-gray-500">Per Unit</span>
            </div>
          </div>

          {hasDetails ? (
            <div className="space-y-6">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Technical Details */}
              {product.technical_details && Object.keys(product.technical_details).length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Technical Details</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                    {Object.entries(product.technical_details).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded-lg">
                        <div className="text-xs font-medium text-gray-500">{key}</div>
                        <div className="text-sm text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Included Items */}
              {product.included_items && product.included_items.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">What's Included</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.included_items.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warranty Information */}
              {product.warranty_info && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Warranty Information</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-600">{product.warranty_info}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Additional Details Available</h3>
              <p className="text-gray-500">Basic product information is shown above.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Update OrderSummary component
const OrderSummary: React.FC<OrderSummaryProps> = ({ products, installationPrice, productsTax, total, formData }) => {
  const [selectedProduct, setSelectedProduct] = useState<CheckoutProps['products'][0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product: CheckoutProps['products'][0]) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-gray-600 font-medium">Item</th>
                  <th className="px-6 py-4 text-center text-gray-600 font-medium">Quantity</th>
                  <th className="px-6 py-4 text-right text-gray-600 font-medium">Price</th>
                  <th className="px-6 py-4 text-right text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product: CheckoutProps['products'][0], index: number) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer" 
                    onClick={() => handleProductClick(product)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        {product.is_service && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Service
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900">{product.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(product.price * product.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 bg-white rounded-lg border border-gray-100 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(products.reduce((sum: number, p: CheckoutProps['products'][0]) => sum + p.price * p.quantity, 0))}
                </span>
              </div>
              {installationPrice > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Installation</span>
                  <span className="font-medium text-gray-900">{formatCurrency(installationPrice)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">{formatCurrency(productsTax)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
                {formData.paymentPlan === 'installments' ? (
                  <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Due Today (Down Payment)</span>
                      <span className="font-bold text-blue-600">{formatCurrency(formData.downPayment || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Remaining Balance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(formData.totalDueAfterFirst || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Payment Plan</span>
                      <span className="font-medium text-gray-900">
                        {formData.numberOfInstallments} payments of {formatCurrency(formData.installmentAmount || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Full Payment Due Today</span>
                      <span className="font-bold text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
};

// Main Checkout component
export default function Checkout({
  products,
  onClose,
  onSubmit,
  installationPrice = 0,
  clearCart
}: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CheckoutFormData>({
    contractNumber: generateContractNumber(),
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
    paymentPlan: 'full',
    signature: null,
    dueToday: null,
    totalDueAfterFirst: null,
    numberOfInstallments: null,
    installmentAmount: null,
    downPayment: null
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const signaturePadRef = useRef<SignaturePadType>(null);

  // Get active steps based on whether installation is selected
  const activeSteps = steps.filter(step => 
    !step.showWhen || step.showWhen(installationPrice)
  );

  const handleInputChange = (data: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateStep = (stepId: string): boolean => {
    const newErrors = validateStepData(stepId, formData);
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
    setCurrentStep(prev => prev - 1);
  };

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
          // Calculate totals
          const productSubtotal = products.reduce((sum, p) => 
            sum + (p.our_price || p.price) * p.quantity, 0);
          const serviceSubtotal = products
            .filter(p => p.is_service || p.category === 'Services')
            .reduce((sum, p) => sum + (p.our_price || p.price) * p.quantity, 0);
          const tax = calculateTax(products);
          const total = productSubtotal + serviceSubtotal + tax + (installationPrice || 0);

          // Calculate initial payment amount based on payment plan
          const initialPaymentAmount = formData.paymentPlan === 'full' ? 
            total : 
            (formData.downPayment || total * 0.25);

          // Calculate installment amount for installment plans
          const installmentAmount = formData.paymentPlan === 'installments' && formData.numberOfInstallments ? 
            (total - (formData.downPayment || 0)) / formData.numberOfInstallments : 
            undefined;

          // Prepare the contract data
          const contractData = {
            ...formData,
            products,
            productSubtotal,
            serviceSubtotal,
            tax,
            total,
            paymentPlan: formData.paymentPlan || 'full',
            dueToday: initialPaymentAmount,
            payment_status: formData.paymentPlan === 'full' ? 'completed' : 'partial',
            total_paid: initialPaymentAmount,
            contractNumber: formData.contractNumber,
            order_creator: localStorage.getItem('userName') || 'Unknown',
            installationPrice,
            installmentAmount: formData.paymentPlan === 'installments' ? formData.installmentAmount : null,
            downPayment: formData.paymentPlan === 'installments' ? formData.downPayment : initialPaymentAmount,
            numberOfInstallments: formData.paymentPlan === 'installments' ? formData.numberOfInstallments : null,
            totalDueAfterFirst: formData.paymentPlan === 'installments' ? total - initialPaymentAmount : null,
            paymentRecord: {
              amount: initialPaymentAmount,
              payment_method: formData.paymentMethod,
              payment_type: 'initial',
              notes: 'Initial installment payment',
              created_at: new Date().toISOString()
            }
          };

          console.log('Submitting contract data:', contractData);

          await onSubmit(contractData);
          clearCart();
          onClose();
          toast.success("Order completed successfully!");
        } catch (error) {
          console.error('Error submitting form:', error);
          setErrors({ submit: 'Failed to submit the form. Please try again.' });
          toast.error(error instanceof Error ? error.message : "Failed to complete order. Please try again.");
        } finally {
          setIsLoading(false);
        }
      } else {
        handleNext();
      }
    }
  };

  const handleStepClick = (index: number) => {
    if (index < currentStep) {
      setCurrentStep(index);
      setErrors({});
    }
  };

  const renderStep = () => {
    const currentStepId = activeSteps[currentStep]?.id;
    const stepProps = {
      formData,
      onChange: handleInputChange,
      errors,
      onSubmit: handleSubmit,
      products,
      installationPrice
    };

    switch (currentStepId) {
      case 'contact':
        return <ContactStep {...stepProps} />;
      case 'shipping':
        return <ShippingStep {...stepProps} />;
      case 'payment':
        return <PaymentStep {...stepProps} />;
      case 'installation':
        return <InstallationStep {...stepProps} />;
      case 'review':
        return (
          <ReviewStep
            {...stepProps}
            products={products}
            installationPrice={installationPrice}
            signaturePadRef={signaturePadRef}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CheckoutLayout
      onClose={onClose}
      currentStep={currentStep}
      activeSteps={activeSteps}
      handleStepClick={handleStepClick}
      handleBack={handleBack}
      handleSubmit={handleSubmit}
      handleNext={handleNext}
      isLoading={isLoading}
      formData={formData}
      renderStep={renderStep}
    />
  );
}

// Add missing component interfaces
interface CustomerInformationProps {
  formData: CheckoutFormData;
}
interface ShippingInformationProps {
  formData: CheckoutFormData;
}
interface OrderSummaryProps {
  products: CheckoutProps['products'];
  installationPrice: number;
  productsTax: number;
  total: number;
  formData: CheckoutFormData;
}
interface InstallationInformationProps {
  formData: CheckoutFormData;
}
interface SignatureSectionProps {
  formData: CheckoutFormData;
  onChange: (data: Partial<CheckoutFormData>) => void;
  errors: { [key: string]: string };
  signaturePadRef: React.RefObject<SignaturePadType>;
}

// Add missing components
const CustomerInformation: React.FC<CustomerInformationProps> = ({ formData }) => (
  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-blue-100 p-2.5 rounded-lg">
        <User className="h-5 w-5 text-blue-600" />
                      </div>
      <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                            </div>
    <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
      <div className="p-4 flex items-center">
        <div className="w-1/3">
          <span className="text-sm font-medium text-gray-500">Full Name</span>
                            </div>
        <div className="w-2/3">
          <span className="text-sm font-semibold text-gray-900">{formData.firstName} {formData.lastName}</span>
                          </div>
                            </div>
      <div className="p-4 flex items-center">
        <div className="w-1/3">
          <span className="text-sm font-medium text-gray-500">Email</span>
                              </div>
        <div className="w-2/3">
          <span className="text-sm font-semibold text-gray-900 break-all">{formData.email}</span>
                          </div>
                        </div>
      <div className="p-4 flex items-center">
        <div className="w-1/3">
          <span className="text-sm font-medium text-gray-500">Phone</span>
        </div>
        <div className="w-2/3">
          <span className="text-sm font-semibold text-gray-900">{formData.phone}</span>
        </div>
      </div>
      {formData.organization && (
        <div className="p-4 flex items-center">
          <div className="w-1/3">
            <span className="text-sm font-medium text-gray-500">Organization</span>
          </div>
          <div className="w-2/3">
            <span className="text-sm font-semibold text-gray-900">{formData.organization}</span>
                      </div>
                    </div>
                  )}
    </div>
  </div>
);

const ShippingInformation: React.FC<ShippingInformationProps> = ({ formData }) => (
  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-blue-100 p-2.5 rounded-lg">
        <MapPin className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
    </div>
                  <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <span className="text-gray-500 min-w-[100px] mt-0.5">Address:</span>
            <div className="font-medium text-gray-900">
              <p>{formData.shippingAddress}</p>
              <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZip}</p>
                    </div>
          </div>
          {formData.shippingInstructions && (
            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
              <span className="text-gray-500 min-w-[100px] mt-0.5">Instructions:</span>
              <p className="text-gray-700 italic">{formData.shippingInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const PaymentDetails: React.FC<{ formData: CheckoutFormData; products: CheckoutProps['products']; installationPrice: number; onChange: (data: Partial<CheckoutFormData>) => void; }> = ({ 
  formData, 
  products, 
  installationPrice,
  onChange
}) => {
  const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const tax = calculateTax(products);
  const total = subtotal + tax + installationPrice;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2.5 rounded-lg">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Payment Method</span>
          <div className="flex items-center gap-2">
            {formData.paymentMethod === 'cash' && <BanknoteIcon className="h-4 w-4 text-green-500" />}
            {formData.paymentMethod === 'check' && <FileCheck className="h-4 w-4 text-blue-500" />}
            {formData.paymentMethod === 'paypal' && <CreditCard className="h-4 w-4 text-blue-600" />}
            {formData.paymentMethod === 'zelle' && <Building2 className="h-4 w-4 text-purple-500" />}
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {formData.paymentMethod.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Payment Plan</span>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {formData.paymentPlan === 'full' ? 'Pay in Full' : 'Pay in Installments'}
          </span>
        </div>
        {formData.paymentPlan === 'installments' && (
          <div className="space-y-4">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Down Payment</span>
              <input
                type="number"
                min={total * 0.1}
                max={total}
                step="0.01"
                value={formData.downPayment || ''}
                onChange={(e) => onChange({ downPayment: parseFloat(e.target.value) })}
                className="w-32 p-2 border rounded-md text-sm font-semibold text-gray-900 text-right"
                placeholder="Enter down payment amount"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Number of Installments</span>
              <select
                className="w-32 p-2 border rounded-md text-sm font-semibold text-gray-900"
                value={formData.numberOfInstallments || ''}
                onChange={(e) => onChange({ numberOfInstallments: parseInt(e.target.value) })}
              >
                <option value="">Select number of installments</option>
                <option value="3">3 installments</option>
                <option value="4">4 installments</option>
                <option value="6">6 installments</option>
                <option value="12">12 installments</option>
              </select>
            </div>
            {formData.numberOfInstallments && formData.downPayment && formData.installmentAmount && (
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Down Payment (Due Today)</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(formData.downPayment)}</span>
              </div>
            )}
          </div>
        )}
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Subtotal</span>
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        {installationPrice > 0 && (
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Installation</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(installationPrice)}</span>
          </div>
        )}
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Tax</span>
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(tax)}</span>
        </div>
        <div className="p-4 flex items-center justify-between bg-gray-50">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-base font-bold text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

const TermsAndConditions: React.FC = () => (
  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-blue-100 p-2.5 rounded-lg">
        <FileText className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Terms and Conditions</h3>
    </div>
    <div className="bg-white rounded-lg p-6 border border-gray-100">
      <p className="text-gray-600 mb-6">
        By signing this agreement, you acknowledge and agree to the following terms:
      </p>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">1</div>
          <div>
            <p className="text-gray-900"><strong>Payment Terms:</strong> Payment is due according to the selected payment method and plan. For full payments, the entire amount is due upon signing. For installment plans:</p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>Down payment is required at the time of signing</li>
              <li>Remaining balance will be divided into agreed-upon installments</li>
              <li>Each installment payment is due on the same day of subsequent months</li>
              <li>Late payments may incur additional fees</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">2</div>
          <div>
            <p className="text-gray-900"><strong>Payment Default:</strong> In the event of payment default:</p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>A grace period of 5 business days is provided for each installment</li>
              <li>Late fees of 5% will apply after the grace period</li>
              <li>Services may be suspended until payment is received</li>
              <li>Legal action may be taken for continued non-payment</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">3</div>
          <div>
            <p className="text-gray-900"><strong>Installation and Services:</strong> If installation services are included:</p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>Customer must provide access to premises at scheduled time</li>
              <li>Rescheduling with less than 48 hours notice may incur fees</li>
              <li>Installation area must be prepared according to specifications</li>
              <li>Additional work beyond scope will require separate agreement</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">4</div>
          <div>
            <p className="text-gray-900"><strong>Early Payoff:</strong> For installment plans:</p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>Early payoff of remaining balance is allowed at any time</li>
              <li>No prepayment penalties will be charged</li>
              <li>Contact our office for current payoff amount</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">5</div>
          <div>
            <p className="text-gray-900"><strong>Warranty and Returns:</strong></p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>Products include manufacturer's standard warranty</li>
              <li>Installation work is guaranteed for quality and workmanship</li>
              <li>Returns accepted within 3 days for unopened products only</li>
              <li>Custom items and installed products are non-returnable</li>
              <li>Refunds will be applied to the remaining balance or future payments</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">6</div>
          <div>
            <p className="text-gray-900"><strong>Cancellation and Modifications:</strong></p>
            <ul className="mt-2 ml-4 space-y-1 text-gray-700 list-disc">
              <li>Orders may be cancelled within 24 hours without penalty</li>
              <li>Payment plan modifications require written agreement</li>
              <li>Custom orders cannot be cancelled once production begins</li>
              <li>Installation date changes require 48 hours notice</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            By proceeding with this agreement, you confirm that you have read, understood, and agree to these terms and conditions. This agreement is legally binding and enforceable.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SignatureSection: React.FC<SignatureSectionProps> = ({ formData, onChange, errors, signaturePadRef }) => (
  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-blue-100 p-2.5 rounded-lg">
        <PenLine className="h-5 w-5 text-blue-600" />
                    </div>
      <h3 className="text-lg font-semibold text-gray-900">Electronic Signature</h3>
    </div>
    <div className="bg-white rounded-lg p-6 border border-gray-100">
      <p className="text-gray-600 mb-6">
                        By signing below, I acknowledge that I have read and agree to the terms and conditions outlined in this contract.
                        I understand that this electronic signature is legally binding.
                      </p>
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <SignaturePad
                          ref={signaturePadRef}
                          canvasProps={{
            className: 'w-full h-64 bg-white rounded-lg border border-gray-200 shadow-sm',
                          }}
                          onEnd={() => {
                            const dataUrl = signaturePadRef.current?.toDataURL() || null;
            onChange({ signature: dataUrl });
                          }}
                        />
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
                            {formData.signature ? (
                              <>
                                <p className="font-medium text-gray-900">Signed by: {formData.firstName} {formData.lastName}</p>
                <p className="text-xs mt-1">{formatDate(new Date())}</p>
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
                onChange({ signature: null });
                              }
                            }}
            className="text-gray-600 hover:text-gray-900"
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
);

const InstallationInformation: React.FC<InstallationInformationProps> = ({ formData }) => (
  <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-blue-100 p-2.5 rounded-lg">
        <Wrench className="h-5 w-5 text-blue-600" />
                </div>
      <h3 className="text-lg font-semibold text-gray-900">Installation Details</h3>
              </div>
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-600 mb-2">Schedule</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <p className="font-medium text-gray-900">{formData.installationDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="font-medium text-gray-900">{formData.installationTime}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-600 mb-2">On-site Contact</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <p className="font-medium text-gray-900">{formData.contactOnSite}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <p className="font-medium text-gray-900">{formData.contactOnSitePhone}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-600 mb-2">Installation Location</p>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">{formData.installationAddress}</p>
                  <p className="font-medium text-gray-900">
                    {formData.installationCity}, {formData.installationState} {formData.installationZip}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {formData.accessInstructions && (
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-gray-600 mb-2">Access Instructions</p>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-1" />
                <p className="text-gray-700 italic">{formData.accessInstructions}</p>
              </div>
            </div>
          )}
        </div>
      </div>
            </div>
          </div>
        );

// Add validation helper
const validateStepData = (stepId: string, formData: CheckoutFormData): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  switch (stepId) {
    case 'contact':
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) errors.phone = 'Invalid phone number format';
      break;

    case 'shipping':
      if (!formData.shippingAddress.trim()) errors.shippingAddress = 'Shipping address is required';
      if (!formData.shippingCity.trim()) errors.shippingCity = 'City is required';
      if (!formData.shippingState.trim()) errors.shippingState = 'State is required';
      if (!formData.shippingZip.trim()) errors.shippingZip = 'ZIP code is required';
      else if (!validateZip(formData.shippingZip)) errors.shippingZip = 'Invalid ZIP code format';
      break;

    case 'payment':
      if (!formData.paymentMethod) errors.paymentMethod = 'Please select a payment method';
      break;

    case 'installation':
      if (!formData.installationAddress.trim()) errors.installationAddress = 'Installation address is required';
      if (!formData.installationCity.trim()) errors.installationCity = 'City is required';
      if (!formData.installationState.trim()) errors.installationState = 'State is required';
      if (!formData.installationZip.trim()) errors.installationZip = 'ZIP code is required';
      else if (!validateZip(formData.installationZip)) errors.installationZip = 'Invalid ZIP code format';
      if (!formData.installationDate) errors.installationDate = 'Installation date is required';
      if (!formData.installationTime) errors.installationTime = 'Installation time is required';
      if (!formData.contactOnSite.trim()) errors.contactOnSite = 'On-site contact name is required';
      if (!formData.contactOnSitePhone.trim()) errors.contactOnSitePhone = 'On-site contact phone is required';
      else if (!validatePhone(formData.contactOnSitePhone)) errors.contactOnSitePhone = 'Invalid phone number format';
      break;

    case 'review':
      if (!formData.signature) errors.signature = 'Please sign the contract to proceed';
      break;
  }

  return errors;
};

// Add CheckoutLayout component
interface CheckoutLayoutProps {
  onClose: () => void;
  currentStep: number;
  activeSteps: typeof steps;
  handleStepClick: (index: number) => void;
  handleBack: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleNext: () => void;
  isLoading: boolean;
  formData: CheckoutFormData;
  renderStep: () => React.ReactNode;
}

const CheckoutLayout: React.FC<CheckoutLayoutProps> = ({
  onClose,
  currentStep,
  activeSteps,
  handleStepClick,
  handleBack,
  handleSubmit,
  handleNext,
  isLoading,
  formData,
  renderStep
}) => (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
    >
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <m.div
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
                  <m.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStep()}
                  </m.div>
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
          </m.div>
        </div>
      </div>
    </m.div>
); 