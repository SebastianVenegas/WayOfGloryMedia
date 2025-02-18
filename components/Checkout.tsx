'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, X, Calendar, Clock, MapPin, CreditCard, Building2, Truck, FileText, PenLine, Banknote, BanknoteIcon, FileCheck, User, Loader2, Wrench, Package, ClipboardCopy, Info, Phone } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SignaturePad from 'react-signature-canvas'
import type SignaturePadType from 'react-signature-canvas'
import { toast } from 'sonner'
import { LucideIcon } from 'lucide-react'
import Image from 'next/image'

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

// First, let's create interfaces for our step components
interface StepProps {
  formData: CheckoutFormData;
  onChange: (data: Partial<CheckoutFormData>) => void;
  errors: { [key: string]: string };
  onSubmit: () => void;
}

// Extract step components
const ContactStep: React.FC<StepProps> = ({ formData, onChange, errors }) => {
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

const ShippingStep: React.FC<StepProps> = ({ formData, onChange, errors }) => {
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

const PaymentStep: React.FC<StepProps> = ({ formData, onChange, errors }) => {
  const handlePaymentMethodChange = (method: string) => {
    onChange({ paymentMethod: method });
  };

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Select Payment Method</h3>
            <div className="space-y-4">
        <PaymentOption
          title="Cash"
          description="Pay in cash before delivery"
          icon={BanknoteIcon}
          iconColor="text-green-600"
          selected={formData.paymentMethod === 'cash'}
          onClick={() => handlePaymentMethodChange('cash')}
        />

        <PaymentOption
          title="Check"
          description="Pay by check before delivery"
          icon={FileCheck}
          iconColor="text-blue-600"
          selected={formData.paymentMethod === 'check'}
          onClick={() => handlePaymentMethodChange('check')}
        />

        <PaymentOption
          title="Direct Deposit"
          description="Pay via bank transfer"
          icon={Building2}
          iconColor="text-purple-600"
          selected={formData.paymentMethod === 'direct_deposit'}
          onClick={() => handlePaymentMethodChange('direct_deposit')}
          additionalContent={
            formData.paymentMethod === 'direct_deposit' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2">Bank Details:</h5>
                    <div className="space-y-1 text-sm">
                      <p>Bank: Chase Bank</p>
                      <p>Account Name: Way of Glory Media INC</p>
                      <p>Account Number: XXXX-XXXX-XXXX</p>
                      <p>Routing Number: XXXXXXXX</p>
                  <p className="mt-2 text-gray-600">
                    Please include your name and event date in the transfer description
                  </p>
                    </div>
                  </div>
            )
          }
        />
      </div>
      {errors.paymentMethod && (
        <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                )}
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

const InstallationStep: React.FC<StepProps> = ({ formData, onChange, errors }) => {
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

// Update ReviewStep component for better layout
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
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CustomerInformation formData={formData} />
          <ShippingInformation formData={formData} />
                      </div>
        <div className="space-y-6">
          <PaymentDetails 
            formData={formData}
            products={products}
            installationPrice={installationPrice}
          />
          {installationPrice > 0 && (
            <InstallationInformation formData={formData} />
                        )}
                      </div>
                    </div>

      <OrderSummary
        products={products}
        installationPrice={installationPrice}
        productsTax={productsTax}
        total={total}
      />
      
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

// Update OrderSummary component
const OrderSummary: React.FC<OrderSummaryProps> = ({ products, installationPrice, productsTax, total }) => (
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
                          {products.map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
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
              {formatCurrency(products.reduce((sum, p) => sum + p.price * p.quantity, 0))}
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
          </div>
        </div>
      </div>
    </div>
  </div>
);

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
    signature: null
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
          const totalProfit = products.reduce((sum, p) => {
            const profit = ((p.our_price || p.price) - (p.price || 0)) * p.quantity;
            return sum + profit;
          }, 0);

          // Send complete order data
          const orderData = {
            ...formData,
            products,
            productSubtotal,
            serviceSubtotal,
            tax,
            total,
            totalProfit,
            installationPrice,
            contractNumber: formData.contractNumber // Ensure contract number is included
          };

          await onSubmit(orderData);
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
      onSubmit: handleSubmit
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

const PaymentDetails: React.FC<{ formData: CheckoutFormData; products: CheckoutProps['products']; installationPrice: number; }> = ({ 
  formData, 
  products, 
  installationPrice 
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
            {formData.paymentMethod === 'direct_deposit' && <Building2 className="h-4 w-4 text-purple-500" />}
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {formData.paymentMethod.replace('_', ' ')}
            </span>
          </div>
        </div>
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
            <p className="text-gray-900"><strong>Payment Terms:</strong> Payment is due according to the selected payment method. For invoiced orders, payment is due upon receipt.</p>
                      </div>
                    </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">2</div>
          <div>
            <p className="text-gray-900"><strong>Installation:</strong> If installation services are included, the customer agrees to provide access to the premises at the scheduled date and time.</p>
                  </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">3</div>
          <div>
            <p className="text-gray-900"><strong>Warranty:</strong> All products come with manufacturer's warranty. Services are guaranteed for quality and workmanship.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">4</div>
          <div>
            <p className="text-gray-900"><strong>Cancellation:</strong> Orders may be cancelled within 24 hours of placement without penalty. Custom services may not be eligible for cancellation.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">5</div>
          <div>
            <p className="text-gray-900"><strong>Returns:</strong> Products may be returned within 3 days in original condition. Custom items and services are non-refundable.</p>
          </div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
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
); 