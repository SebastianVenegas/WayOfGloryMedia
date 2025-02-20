'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface CheckoutProps {
  cartItems: {
    title: string
    price: number
    quantity: number
    addons?: {
      warranty: boolean
      installation: boolean
    }
    category?: string
    is_service?: boolean
    is_custom?: boolean
  }[]
  onClose: () => void
  clearCart: () => void
}

interface CustomerInfo {
  fullName: string
  email: string
  phone: string
  shippingAddress: string
  agreeToTerms: boolean
}

type PaymentMethod = 'directDeposit' | 'checkPayment'

const slideUpAndFade = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      duration: 0.7,
      bounce: 0.2
    }
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    transition: { duration: 0.3 }
  }
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      duration: 0.6,
      bounce: 0.2
    }
  }
}

export function Checkout({ cartItems, onClose, clearCart }: CheckoutProps) {
  const [step, setStep] = useState(1)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    phone: '',
    shippingAddress: '',
    agreeToTerms: false
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('directDeposit')
  const [isComplete, setIsComplete] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments'>('full')
  const [dueToday, setDueToday] = useState<number>(0)
  const [totalDueAfterFirst, setTotalDueAfterFirst] = useState<number>(0)
  const [paymentFrequency, setPaymentFrequency] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly'>('Monthly')

  const totalPrice = cartItems.reduce((sum, item) => {
    const basePrice = item.price * item.quantity
    const addonsPrice = item.addons ? 
      (item.addons.warranty ? 199 : 0) + (item.addons.installation ? 299 : 0) : 0
    return sum + basePrice + addonsPrice
  }, 0)

  const taxableAmount = cartItems.reduce((sum, item) => {
    // Skip tax for services - check title for "Service" keyword as well
    if (
      item.category === 'Services' || 
      item.category === 'Services/Custom' || 
      item.is_service || 
      item.is_custom ||
      item.title.toLowerCase().includes('service')
    ) {
      return sum;
    }
    const basePrice = item.price * item.quantity;
    const addonsPrice = item.addons ? 
      (item.addons.warranty ? 199 : 0) : 0; // Only warranty is taxable, installation is not
    return sum + basePrice + addonsPrice;
  }, 0);

  const salesTax = taxableAmount * 0.0775; // 7.75% tax rate

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else handleComplete()
  }

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = async () => {
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    try {
      // Calculate initial payment amount based on payment plan
      const totalWithTax = totalPrice + salesTax;
      const initialPaymentAmount = paymentPlan === 'installments' ? dueToday : totalWithTax;
      
      const initialPayment = {
        amount: initialPaymentAmount,
        payment_type: paymentPlan === 'installments' ? 'initial' : 'full'
      };

      // First create the order
      const orderResponse = await fetch('/api/order-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo,
          cartItems,
          paymentMethod,
          orderId,
          totalPrice: totalWithTax,
          paymentPlan,
          dueToday: paymentPlan === 'installments' ? dueToday : totalWithTax,
          totalDueAfterFirst: paymentPlan === 'installments' ? totalDueAfterFirst : 0,
          paymentFrequency,
          initialPayment
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error('Failed to create order');
      }

      // Clear cart and show completion
      clearCart();
      setIsComplete(true);
      
    } catch (error: unknown) {
      console.error('Error completing order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete order. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          customerInfo.fullName &&
          customerInfo.email &&
          customerInfo.phone &&
          customerInfo.shippingAddress &&
          customerInfo.agreeToTerms
        )
      case 2:
        return paymentMethod
      default:
        return true
    }
  }

  const PaymentDetails = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Plan</h3>
          <RadioGroup 
            value={paymentPlan}
            onValueChange={(value: 'full' | 'installments') => {
              setPaymentPlan(value);
              if (value === 'full') {
                setDueToday(totalPrice);
                setTotalDueAfterFirst(0);
              } else {
                // Default to 50% down payment for installments
                setDueToday(totalPrice * 0.5);
                setTotalDueAfterFirst(totalPrice * 0.5);
              }
            }}
            className="grid gap-4"
          >
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full">
                <div className="font-medium">Pay in Full</div>
                <div className="text-sm text-gray-500">Pay the entire amount now: ${totalPrice.toFixed(2)}</div>
              </Label>
            </div>
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <RadioGroupItem value="installments" id="installments" />
              <Label htmlFor="installments">
                <div className="font-medium">Installment Plan</div>
                <div className="text-sm text-gray-500">Split your payment into manageable installments</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {paymentPlan === 'installments' && (
          <div className="space-y-4">
            <div>
              <Label>Due Today</Label>
              <Input
                type="number"
                value={dueToday}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setDueToday(value);
                  setTotalDueAfterFirst(totalPrice - value);
                }}
                min={0}
                max={totalPrice}
                step={0.01}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum 50% down payment required</p>
            </div>

            <div>
              <Label>Payment Frequency</Label>
              <Select 
                value={paymentFrequency}
                onValueChange={(value: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly') => 
                  setPaymentFrequency(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-2">
                  <span>Due Today:</span>
                  <span className="font-medium">${dueToday.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">${totalDueAfterFirst.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <motion.div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative"
        variants={slideUpAndFade}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="p-8">
          {/* Header with close button */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.h2 
              variants={staggerItem}
              className="text-2xl font-bold text-gray-900"
            >
              {isComplete ? 'Order Confirmation' : 'Checkout - Glory Way Media'}
            </motion.h2>
            <motion.button
              variants={staggerItem}
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div 
                key="checkout"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Progress Steps */}
                <motion.div 
                  className="relative mb-12"
                  variants={staggerItem}
                >
                  {/* Progress Line */}
                  <div className="absolute top-[15px] left-[40px] right-[40px] h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#1a365d] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: `${((step - 1) / 2) * 100}%` 
                      }}
                      transition={{ 
                        duration: 0.7,
                        ease: [0.4, 0.0, 0.2, 1]
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative flex items-center justify-between">
                    {[
                      { step: 1, label: "Information" },
                      { step: 2, label: "Payment" },
                      { step: 3, label: "Review" }
                    ].map(({ step: s, label }) => (
                      <div key={s} className="flex flex-col items-center">
                        <motion.div
                          className={`
                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                            ${step >= s ? 'bg-[#1a365d]' : 'bg-gray-100'}
                            transition-colors duration-500
                          `}
                          initial={false}
                          animate={step >= s ? {
                            scale: [1, 1.15, 1],
                            transition: { duration: 0.4 }
                          } : {}}
                        >
                          {step > s ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                duration: 0.4,
                                type: "spring",
                                bounce: 0.3
                              }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          ) : (
                            <motion.span 
                              className={step >= s ? 'text-white' : 'text-gray-400'}
                              initial={false}
                              animate={step === s ? {
                                scale: [1, 1.1, 1],
                                transition: { 
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  duration: 2,
                                  ease: "easeInOut"
                                }
                              } : {}}
                            >
                              {s}
                            </motion.span>
                          )}

                          {/* Pulse Effect for Current Step */}
                          {step === s && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-[#1a365d]"
                              initial={{ opacity: 0.3, scale: 1 }}
                              animate={{ 
                                opacity: 0, 
                                scale: 1.5,
                                transition: {
                                  repeat: Infinity,
                                  duration: 2,
                                  ease: "easeOut"
                                }
                              }}
                            />
                          )}
                        </motion.div>

                        {/* Step Label */}
                        <motion.span
                          className={`
                            mt-2 text-sm font-medium
                            ${step >= s ? 'text-[#1a365d]' : 'text-gray-400'}
                          `}
                          initial={false}
                          animate={step === s ? {
                            scale: [1, 1.05, 1],
                            transition: { duration: 0.4 }
                          } : {}}
                        >
                          {label}
                        </motion.span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-6"
                    >
                      <motion.h3 
                        variants={staggerItem}
                        className="text-xl font-semibold mb-6"
                      >
                        Step 1: Customer Information
                      </motion.h3>
                      {/* Input fields with stagger animation */}
                      {[
                        { placeholder: "Full Name", value: customerInfo.fullName, key: "fullName" },
                        { placeholder: "Email", value: customerInfo.email, key: "email", type: "email" },
                        { placeholder: "Phone Number", value: customerInfo.phone, key: "phone", type: "tel" },
                        { placeholder: "Shipping Address", value: customerInfo.shippingAddress, key: "shippingAddress" }
                      ].map((field) => (
                        <motion.div key={field.key} variants={staggerItem}>
                          <Input
                            placeholder={field.placeholder}
                            type={field.type}
                            value={field.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setCustomerInfo({ ...customerInfo, [field.key]: e.target.value })
                            }
                          />
                        </motion.div>
                      ))}
                      <motion.div 
                        variants={staggerItem}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={customerInfo.agreeToTerms}
                          onCheckedChange={(checked: boolean) => 
                            setCustomerInfo({ ...customerInfo, agreeToTerms: checked })
                          }
                        />
                        <label className="text-sm text-gray-600">
                          I agree to the terms & conditions
                        </label>
                      </motion.div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-6"
                    >
                      <motion.h3 
                        variants={staggerItem}
                        className="text-xl font-semibold mb-6"
                      >
                        Step 2: Payment Method
                      </motion.h3>
                      <div className="space-y-4">
                        {['directDeposit', 'checkPayment'].map((method) => (
                          <motion.button
                            key={method}
                            onClick={() => setPaymentMethod(method as PaymentMethod)}
                            className={`
                              w-full p-4 rounded-xl border text-left flex items-center gap-3
                              ${paymentMethod === method 
                                ? 'border-[#1a365d] bg-[#1a365d]/5' 
                                : 'border-gray-200 hover:border-[#1a365d]/30'}
                            `}
                          >
                            <motion.div 
                              className="w-5 h-5 rounded-full border-2 border-[#1a365d] flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                              animate={paymentMethod === method ? { scale: 1 } : {}}
                            >
                              <motion.div
                                initial={false}
                                animate={{ scale: paymentMethod === method ? 1 : 0 }}
                                className="w-3 h-3 rounded-full bg-[#1a365d]"
                              />
                            </motion.div>
                            <motion.span 
                              className="font-medium"
                              variants={staggerItem}
                            >
                              {method === 'directDeposit' ? 'Direct Deposit' : 'Check Payment'}
                            </motion.span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-6"
                    >
                      <motion.h3 
                        variants={staggerItem}
                        className="text-xl font-semibold mb-6"
                      >
                        Step 3: Order Summary
                      </motion.h3>
                      {cartItems.map((item, index) => (
                        <motion.div 
                          key={index} 
                          className="bg-gray-50 rounded-xl p-4"
                          variants={staggerItem}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <motion.h4 
                              className="font-medium"
                              variants={staggerItem}
                            >
                              {item.title}
                            </motion.h4>
                            <motion.span 
                              className="font-semibold"
                              variants={staggerItem}
                            >
                              ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </motion.span>
                          </div>
                          {item.addons && (
                            <motion.div 
                              className="text-sm text-gray-600 space-y-1"
                              variants={staggerItem}
                            >
                              {item.addons.warranty && <motion.div>+ Extended Warranty ($199)</motion.div>}
                              {item.addons.installation && <motion.div>+ Professional Installation ($299)</motion.div>}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                      <motion.div 
                        className="border-t pt-4"
                        variants={staggerItem}
                      >
                        <motion.div 
                          className="flex justify-between items-center text-lg"
                          variants={staggerItem}
                        >
                          <motion.div className="space-y-2 w-full">
                            <div className="flex justify-between text-base">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-gray-600">Sales Tax (7.75%):</span>
                              <span className="font-medium">${salesTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-lg pt-2 border-t">
                              <span className="font-semibold text-gray-900">Total:</span>
                              <span className="font-bold text-gray-900">
                                ${(totalPrice + salesTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                      <motion.div 
                        className="bg-gray-50 rounded-xl p-4 space-y-2"
                        variants={staggerItem}
                      >
                        <motion.h4 
                          className="font-medium mb-3"
                          variants={staggerItem}
                        >
                          Terms and Services
                        </motion.h4>
                        <motion.div 
                          className="text-sm text-gray-600 space-y-4"
                          variants={staggerItem}
                        >
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Equipment Terms</h5>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>All equipment remains the property of Santi Sounds</li>
                              <li>Equipment must be returned in the same condition as received</li>
                              <li>Client is responsible for any damage or loss during the rental period</li>
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Payment Terms</h5>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Full payment must be received before equipment delivery</li>
                              <li>A security deposit may be required for certain equipment</li>
                              <li>Cancellation fees may apply if cancelled within 48 hours of the event</li>
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Client Responsibilities</h5>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Provide adequate power supply as specified</li>
                              <li>Ensure safe storage of equipment during the rental period</li>
                              <li>Report any issues immediately</li>
                              <li>No modifications or repairs to be attempted by the client</li>
                            </ul>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <motion.div 
                  className="flex justify-between mt-8"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {step > 1 && (
                    <motion.div 
                      variants={staggerItem}
                      whileHover={{ scale: 1.02, x: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>
                    </motion.div>
                  )}
                  <motion.div 
                    variants={staggerItem}
                    className="ml-auto"
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className="flex items-center gap-2 bg-[#1a365d] hover:bg-[#1e4976] text-white"
                    >
                      {step === 3 ? 'Complete Order' : 'Next'} 
                      {step < 3 && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="confirmation"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-8"
              >
                <motion.div 
                  className="text-center"
                  variants={staggerItem}
                >
                  <motion.div 
                    className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      duration: 0.8,
                      bounce: 0.4,
                      delay: 0.2
                    }}
                  >
                    <Check className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-gray-900 mb-3"
                    variants={staggerItem}
                  >
                    Order Received!
                  </motion.h3>
                  <motion.div
                    className="space-y-2 text-gray-600"
                    variants={staggerItem}
                  >
                    <p>Thank you for your order. We're processing it now.</p>
                    <p className="text-sm">
                      A confirmation email will be sent to <span className="font-medium text-gray-900">{customerInfo.email}</span> once your order is confirmed.
                    </p>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="space-y-6"
                  variants={staggerContainer}
                >
                  <motion.div 
                    className="bg-gray-50 rounded-xl p-6"
                    variants={staggerItem}
                  >
                    <motion.div className="flex items-center justify-between mb-4">
                      <motion.h4 
                        className="text-lg font-semibold text-gray-900"
                        variants={staggerItem}
                      >
                        Order Summary
                      </motion.h4>
                      <motion.span 
                        className="text-sm text-gray-500"
                        variants={staggerItem}
                      >
                        Order ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                      </motion.span>
                    </motion.div>
                    {cartItems.map((item, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0"
                        variants={staggerItem}
                      >
                        <div className="space-y-1">
                          <motion.div 
                            className="font-medium text-gray-900"
                            variants={staggerItem}
                          >
                            {item.title}
                          </motion.div>
                          {item.addons && (
                            <motion.div 
                              className="text-sm text-gray-500 space-y-1"
                              variants={staggerItem}
                            >
                              {item.addons.warranty && <div>+ Extended Warranty</div>}
                              {item.addons.installation && <div>+ Professional Installation</div>}
                            </motion.div>
                          )}
                        </div>
                        <motion.span 
                          className="font-medium text-gray-900"
                          variants={staggerItem}
                        >
                          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.span>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div 
                    className="bg-gray-50 rounded-xl p-6"
                    variants={staggerItem}
                  >
                    <motion.h4 
                      className="text-lg font-semibold text-gray-900 mb-4"
                      variants={staggerItem}
                    >
                      Customer Information
                    </motion.h4>
                    <motion.div 
                      className="space-y-3 text-gray-600"
                      variants={staggerItem}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{customerInfo.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span>{customerInfo.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span>{customerInfo.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Shipping Address:</span>
                        <span>{customerInfo.shippingAddress}</span>
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-50 rounded-xl p-6"
                    variants={staggerItem}
                  >
                    <motion.h4 
                      className="text-lg font-semibold text-gray-900 mb-4"
                      variants={staggerItem}
                    >
                      Payment Method
                    </motion.h4>
                    <motion.div 
                      className="space-y-3"
                      variants={staggerItem}
                    >
                      <div className="font-medium text-gray-900">
                        {paymentMethod === 'directDeposit' ? 'Direct Deposit' : 'Check Payment'}
                      </div>
                      {paymentMethod === 'checkPayment' && (
                        <motion.div 
                          className="text-gray-600 mt-2"
                          variants={staggerItem}
                        >
                          <p className="font-medium text-gray-700 mb-2">Please mail your check to:</p>
                          <p>
                            Glory Way Media LLC<br />
                            123 Media Lane<br />
                            Audioville, CA 90210
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-50 rounded-xl p-6"
                    variants={staggerItem}
                  >
                    <motion.h4 
                      className="text-lg font-semibold text-gray-900 mb-4"
                      variants={staggerItem}
                    >
                      Payment Details
                    </motion.h4>
                    <PaymentDetails />
                  </motion.div>

                  <motion.div 
                    className="bg-gray-50 rounded-xl p-6"
                    variants={staggerItem}
                  >
                    <motion.h4 
                      className="text-lg font-semibold text-gray-900 mb-4"
                      variants={staggerItem}
                    >
                      Next Steps
                    </motion.h4>
                    <motion.ul 
                      className="space-y-3 text-gray-600"
                      variants={staggerItem}
                    >
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-sm font-medium">1</span>
                        </span>
                        <span>We'll review your order and send a confirmation email within 24 hours.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-sm font-medium">2</span>
                        </span>
                        <span>Once confirmed, we'll process your payment and prepare your order.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-sm font-medium">3</span>
                        </span>
                        <span>Our team will contact you to arrange delivery and installation (if selected).</span>
                      </li>
                    </motion.ul>
                  </motion.div>

                  <motion.div 
                    className="border-t border-gray-200 pt-4 mt-6"
                    variants={staggerItem}
                  >
                    <motion.div 
                      className="flex justify-between items-center text-lg"
                      variants={staggerItem}
                    >
                      <motion.span 
                        className="font-semibold text-gray-900"
                        variants={staggerItem}
                      >
                        Total:
                      </motion.span>
                      <motion.span 
                        className="font-bold text-gray-900"
                        variants={staggerItem}
                      >
                        ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </motion.span>
                    </motion.div>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="pt-6"
                  variants={staggerItem}
                >
                  <Button
                    onClick={() => {
                      clearCart() // Clear cart when closing the confirmation
                      onClose() // Close the checkout modal
                    }}
                    className="w-full bg-[#1a365d] hover:bg-[#1e4976] text-white font-medium"
                  >
                    Close
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
} 