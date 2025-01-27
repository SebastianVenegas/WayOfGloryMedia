"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ShoppingBag, X, Plus, Minus, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Checkout, { CheckoutFormData } from './Checkout'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Package } from 'lucide-react'
import { productImages } from '@/app/admin/products/page'
import { Input } from '@/components/ui/input'

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

export default function Bundle({ products, onRemove, onUpdateQuantity }: BundleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [installationSelected, setInstallationSelected] = useState(false)
  const [installationPrice, setInstallationPrice] = useState(0)

  const totalPrice = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  )

  const handleCheckout = async (formData: CheckoutFormData) => {
    try {
      const contract = {
        products,
        customerInfo: formData,
        total: totalPrice + (installationSelected ? installationPrice : 0),
        contractDate: new Date().toISOString(),
        status: 'pending'
      }
      
      console.log('Generating contract:', contract)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsCheckoutOpen(false)
      setIsOpen(false)
      alert('Contract generated successfully! Our team will contact you shortly to confirm the details.')
    } catch (error) {
      console.error('Error generating contract:', error)
      alert('There was an error generating your contract. Please try again.')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bundle-toggle fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-white"
        >
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            {products.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                {products.reduce((sum, product) => sum + product.quantity, 0)}
              </span>
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Your Bundle</SheetTitle>
          <SheetDescription>
            {products.length === 0 ? (
              "Your bundle is empty. Add some products!"
            ) : (
              `${products.reduce((sum, product) => sum + product.quantity, 0)} items in your bundle`
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-8 space-y-6">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-lg p-4 space-y-3"
              >
                {/* Product Header */}
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-white border border-gray-200">
                    {(() => {
                      const key = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      const images = productImages[key as keyof typeof productImages]
                      if (images && images.length > 0) {
                        return (
                          <Image
                            src={images[0]}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                            sizes="80px"
                          />
                        )
                      } else if (product.image_url) {
                        return (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                            sizes="80px"
                          />
                        )
                      } else {
                        return (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )
                      }
                    })()}
                  </div>

                  {/* Title and Price */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {product.title}
                    </h4>
                    <div className="text-sm font-medium text-blue-600">
                      ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {onUpdateQuantity && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(product.id, product.quantity - 1)}
                        disabled={product.quantity <= 1}
                        className="h-7 w-7"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center text-sm">
                        {product.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                        className="h-7 w-7"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200 mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-gray-900">Subtotal</span>
              <span className="text-lg font-medium text-gray-900">
                ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">Tax will be calculated at checkout</p>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={installationSelected}
                    onChange={(e) => setInstallationSelected(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-900">Add Installation Service</span>
                </label>
              </div>
              {installationSelected && (
                <div className="mt-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      type="number"
                      value={installationPrice}
                      onChange={(e) => setInstallationPrice(parseFloat(e.target.value) || 0)}
                      className="pl-7"
                      placeholder="Enter installation price"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the installation service price</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-lg font-semibold text-blue-600">
                ${(totalPrice + (installationSelected ? installationPrice : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Create Contract
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-gray-500">
                By creating a contract, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>

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
          />
        )}
      </AnimatePresence>
    </Sheet>
  )
} 