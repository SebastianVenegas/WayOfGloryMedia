"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ShoppingBag, X, Plus, Minus, ChevronRight, Package, Trash2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Checkout, { CheckoutFormData } from './Checkout'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from '@/components/ui/input'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  features?: string[];
  technical_details?: Record<string, string>;
  included_items?: string[];
  warranty_info?: string;
  installation_available?: boolean;
  our_price?: number;
  images?: { image_url: string }[];
}

interface BundleItem extends Product {
  quantity: number;
}

interface BundleProps {
  products: BundleItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
}

const getProductImageKey = (title: string): string => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

export default function Bundle({ products, onRemove, onUpdateQuantity, isOpen, setIsOpen }: BundleProps) {
  const { toast } = useToast()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [installationSelected, setInstallationSelected] = useState(false)
  const [installationPrice, setInstallationPrice] = useState(0)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [width, setWidth] = useState(384)
  const dragRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  const totalPrice = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current && dragRef.current.dataset.dragging === 'true') {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= 300 && newWidth <= 600) {
          setWidth(newWidth)
          document.documentElement.style.setProperty('--cart-width', `${newWidth}px`)
        }
      }
    }

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current.dataset.dragging = 'false'
      }
      document.body.style.cursor = 'default'
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (dragRef.current) {
        dragRef.current.dataset.dragging = 'true'
        document.body.style.cursor = 'ew-resize'
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
      }
    }

    const dragHandle = dragRef.current
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', handleMouseDown)
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('mousedown', handleMouseDown)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleRemove = async (productId: string) => {
    setIsRemoving(productId)
    await new Promise(resolve => setTimeout(resolve, 300))
    onRemove(productId)
    setIsRemoving(null)
  }

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    if (onUpdateQuantity) {
      if (newQuantity >= 1) {
        onUpdateQuantity(productId, newQuantity)
      }
    }
  }

  const handleAddToBundle = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  const handleCheckout = async (formData: any) => {
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }

      // Calculate amounts
      const productSubtotal = totalPrice;
      const tax = productSubtotal * 0.0775; // 7.75% tax on products only
      const installationAmount = installationSelected ? installationPrice : 0;
      const totalAmount = productSubtotal + tax + installationAmount;

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          organization: formData.organization || '',
          shippingAddress: formData.shippingAddress || '',
          shippingCity: formData.shippingCity || '',
          shippingState: formData.shippingState || '',
          shippingZip: formData.shippingZip || '',
          shippingInstructions: formData.shippingInstructions || '',
          installationAddress: formData.installationAddress || '',
          installationCity: formData.installationCity || '',
          installationState: formData.installationState || '',
          installationZip: formData.installationZip || '',
          installationDate: formData.installationDate || '',
          installationTime: formData.installationTime || '',
          accessInstructions: formData.accessInstructions || '',
          contactOnSite: formData.contactOnSite || '',
          contactOnSitePhone: formData.contactOnSitePhone || '',
          paymentMethod: formData.paymentMethod || 'invoice',
          signature: formData.signature || '',
          products: products.map(product => ({
            id: parseInt(product.id),
            title: product.title,
            price: product.price,
            our_price: product.our_price,
            quantity: product.quantity
          })),
          productSubtotal: productSubtotal,
          tax: tax,
          installationPrice: installationAmount,
          totalAmount: totalAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contract');
      }

      // Success toast
      toast({
        title: "Contract Created Successfully! 🎉",
        description: `Order #${data.orderId} has been generated and sent for processing.
Products: $${productSubtotal.toFixed(2)}
Sales Tax: $${tax.toFixed(2)}
${installationAmount > 0 ? `Installation (No Tax): $${installationAmount.toFixed(2)}\n` : ''}
Total: $${totalAmount.toFixed(2)}`,
        variant: "default",
        duration: 5000,
        className: "bg-white border-green-100 text-green-900",
      });

      // Clear the cart and close modals
      setIsCheckoutOpen(false);
      setIsOpen(false);
      return data;
    } catch (error) {
      console.error('Error creating contract:', error);
      
      // Error toast
      toast({
        title: "Error Creating Contract",
        description: error instanceof Error ? error.message : "Failed to create contract. Please try again or contact support if the issue persists.",
        variant: "destructive",
        duration: 7000,
        className: "border-red-100",
      });
      throw error;
    }
  };

  const getProductImage = (title: string) => {
    const key = getProductImageKey(title);
    return `/images/products/${key}/${key}-1.jpg`;
  };

  return (
    <>
      {/* Cart Sidebar */}
      <motion.div
        ref={cartRef}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '0%' : '100%' }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{ width: `${width}px` }}
        className="fixed top-0 right-0 h-full bg-white text-gray-900 z-40 shadow-lg border-l border-gray-100"
      >
        {/* Resize Handle */}
        <div
          ref={dragRef}
          data-dragging="false"
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-gray-100 transition-colors"
        />

        <div className="flex flex-col h-full max-h-screen">
          {/* Header */}
          <div className="shrink-0 p-4 flex items-center justify-between bg-gray-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-700">Bundle</h2>
              <span className="text-sm text-gray-500">
                {products.length === 0 ? "Empty" : `${products.length} items`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-lg h-8 w-8 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-700">Your bundle is empty</h3>
                <p className="text-sm text-gray-500">Add some products to get started</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "group bg-gray-50/50 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all",
                      isRemoving === product.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="p-3">
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="relative h-16 w-16 rounded-lg bg-white overflow-hidden border border-gray-100">
                          <Image
                            src={getProductImage(product.title)}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                            sizes="64px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium line-clamp-1 pr-2">
                              {product.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(product.id)}
                              className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 -mr-2 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="mt-1 text-sm text-gray-400">
                            ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>

                          {/* Controls */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityUpdate(product.id, product.quantity - 1)}
                                disabled={product.quantity <= 1}
                                className="h-6 w-6 rounded bg-white/5 hover:bg-white/10"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {product.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityUpdate(product.id, product.quantity + 1)}
                                className="h-6 w-6 rounded bg-white/5 hover:bg-white/10"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-sm font-medium">
                              ${((product.our_price || product.price) * product.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {products.length > 0 && (
            <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm p-4 space-y-4">
              {/* Installation Option */}
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                <label className="flex items-center gap-2 text-sm flex-1">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-200 text-gray-700 focus:ring-gray-200"
                    checked={installationSelected}
                    onChange={(e) => setInstallationSelected(e.target.checked)}
                  />
                  <span className="text-gray-600">Installation Service</span>
                </label>
                {installationSelected && (
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={installationPrice}
                      onChange={(e) => setInstallationPrice(parseFloat(e.target.value) || 0)}
                      className="pl-6 h-7 text-sm bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-100"
                      placeholder="Price"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Products Subtotal</span>
                  <span className="text-gray-700">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sales Tax</span>
                  <span className="text-gray-700">${(totalPrice * 0.0775).toFixed(2)}</span>
                </div>
                {installationSelected && installationPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Installation (No Tax)</span>
                    <span className="text-gray-700">${installationPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-800">
                    ${(totalPrice + (totalPrice * 0.0775) + (installationSelected ? installationPrice : 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-700 rounded-lg h-10"
                  onClick={() => {
                    // Handle quote creation
                  }}
                >
                  Quote
                </Button>
                <Button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 rounded-lg h-10 font-medium"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Contract
                </Button>
              </div>
              <p className="text-xs text-center text-gray-500">
                By proceeding, you agree to our terms of service
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout
            products={products.map(product => ({
              id: parseInt(product.id),
              title: product.title,
              price: product.price,
              our_price: product.our_price,
              category: product.category,
              quantity: product.quantity
            }))}
            onClose={() => setIsCheckoutOpen(false)}
            onSubmit={handleCheckout}
            installationPrice={installationSelected ? installationPrice : 0}
          />
        )}
      </AnimatePresence>
    </>
  )
} 