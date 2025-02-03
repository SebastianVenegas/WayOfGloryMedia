"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ShoppingBag, X, Plus, Minus, ChevronRight, ChevronLeft, Package, Trash2, AlertCircle, Mic2, Sliders, Cable, Network, Speaker, Headphones, Maximize2, WrenchIcon, Mail } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Checkout, { CheckoutFormData } from './Checkout'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { productImages } from '@/lib/product-images'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-custom"
import { toast } from 'sonner'

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
  is_custom?: boolean;
  is_service?: boolean;
}

interface BundleItem extends Product {
  quantity: number;
}

interface CheckoutProduct {
  id: number
  title: string
  price: number
  quantity: number
  category: string
  our_price?: number
  is_service?: boolean
  is_custom?: boolean
}

interface BundleProps {
  products: CheckoutProduct[]
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  clearCart: () => void
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
  const titleToKeyMap: Record<string, string> = {
    'PTU-6000-8H 8-Channel UHF Wireless Microphone System': 'ptu-6000-8h',
    'Shure BLX288/PG58 Dual Wireless Microphone System': 'shure-blx288-pg58',
    'VocoPro UHF-8800 Professional 8-Channel Wireless System': 'vocopro-uhf-8800',
    'Drum Microphone Kit - 7-Piece Professional Set': 'drum-mic-kit',
    'Behringer X32 Compact Digital Mixer': 'behringer-x32-compact',
    'Allen & Heath SQ-6 48-channel Digital Mixer': 'allen-heath-sq6',
    'Yamaha MGP32X 32-channel Mixer with Effects': 'yamaha-mgp32x',
    'XLR Cable - 15ft Professional Microphone Cable': 'xlr-15ft',
    'XLR Cable - 20ft Professional Microphone Cable': 'xlr-20ft',
    'XLR Cable - 25ft Professional Microphone Cable': 'xlr-25ft',
    'XLR Cable - 50ft Professional Microphone Cable': 'xlr-50ft',
    'XLR Cable - 100ft Professional Microphone Cable': 'xlr-100ft',
    'Quarter Inch Cable - 15ft Professional Instrument Cable': 'quarter-inch-15ft',
    'Quarter Inch Cable - 20ft Professional Instrument Cable': 'quarter-inch-20ft',
    'Cat6 Cable - 10ft Professional Network Cable': 'cat6-10ft',
    'Cat6 Cable - 50ft Professional Network Cable': 'cat6-50ft',
    'Cat6 Cable - 100ft Professional Network Cable': 'cat6-100ft',
    'AC Power Cable - Professional Grade IEC Power Cord': 'ac-power-cable',
    'QSC K12.2 12" 2000W Powered Speaker': 'qsc-k12-2',
    'RSG15 15" 3000W Passive Speaker System': 'rsg15-speaker-system',
    'JBL EON715 15" & EON718S 18" Powered Speaker System': 'jbl-eon715-system',
    'Mackie THUMP215 15" & THUMP118S 18" Powered System': 'mackie-thump215-system',
    'On Stage SS7761B Pro Speaker Stand': 'ss7761b-speaker-stand',
    'On Stage MS7701B Telescoping Boom Stand': 'ms7701b-mic-stand',
    'Kick Drum Microphone Stand': 'kick-drum-mic-stand',
    'On Stage MS7701B Microphone Boom Stand': 'ms7701b-mic-stand',
    'On Stage SS7761B All-Aluminum Speaker Stand': 'ss7761b-speaker-stand',
    'Allen & Heath DX168 Digital Snake': 'allen-heath-dx168',
    'Midas DL16/DL32 Digital Stage Box': 'midas-dl16-dl32',
    'ProCo StageMASTER 32/4 Analog Snake': 'proco-stagemaster-32-4',
    'Hosa HSS-005X 32-Channel Snake': 'hosa-hss-005x',
    'Behringer S32 Digital Snake': 'behringer-s32',
    'Whirlwind M-32/4 Analog Snake': 'whirlwind-m-32-4',
    'Allen & Heath AB168 Digital Snake': 'allen-heath-ab168',
    'Behringer Powerplay P16-M 16-Channel Digital Personal Mixer': 'behringer-powerplay-p16m',
    'Behringer Powerplay P16-I 16-channel Input Module': 'behringer-powerplay-p16i',
    'Behringer Powerplay P16-D 16-channel Distribution Module': 'behringer-powerplay-p16d',
    'In-Ear Monitors (IEM)': 'iem-headphones'
  };

  return titleToKeyMap[title] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

const getProductImage = (product: Product): string => {
  // First try to get image from our static mapping
  const key = getProductImageKey(product.title);
  const staticImages = productImages[key as keyof typeof productImages];
  if (staticImages && staticImages.length > 0) {
    return staticImages[0];
  }

  // Then try product's own images array
  if (product.images?.length) {
    return product.images[0].image_url;
  }
  
  // Then try direct image_url
  if (product.image_url) {
    return product.image_url;
  }
  
  // Finally fall back to placeholder
  return '/images/placeholder.jpg';
};

const calculateBundleTotals = (products: CheckoutProduct[]): { subtotal: number; tax: number; total: number } => {
  let subtotal = 0
  let taxableSubtotal = 0

  products.forEach(product => {
    const itemTotal = (product.our_price || product.price) * product.quantity
    subtotal += itemTotal

    if (!product.category.startsWith('Services') && !product.is_service && !product.is_custom) {
      taxableSubtotal += itemTotal
    }
  })

  const tax = taxableSubtotal * 0.0775 // 7.75% tax
  const total = subtotal + tax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

export default function Bundle({ products, onRemove, onUpdateQuantity, isOpen, setIsOpen, clearCart }: BundleProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const totals = calculateBundleTotals(products)

  const handleCheckout = async (formData: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          products: products.map(p => ({
            id: Number(p.id),
            quantity: p.quantity,
            title: p.title,
            price: p.price
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      toast('Order created successfully');
      clearCart();
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast('Failed to create order');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Bundle</h2>
          {products.length > 0 && (
            <span className="bg-blue-100 text-blue-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {products.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Your bundle is empty</h3>
          <p className="text-sm text-gray-500">Add some products to get started</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg relative group"
                >
                  <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const key = getProductImageKey(product.title);
                      const images = productImages[key as keyof typeof productImages];
                      if (images && images.length > 0) {
                        return (
                          <div className="relative w-full h-full">
                            <Image
                              src={images[0]}
                              alt={product.title}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        );
                      }
                      return <Package className="h-6 w-6 text-gray-400" />;
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      ${(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateQuantity(product.id.toString(), Math.max(1, product.quantity - 1))}
                          disabled={product.quantity <= 1}
                          className="h-7 w-7"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">
                          {product.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateQuantity(product.id.toString(), product.quantity + 1)}
                          className="h-7 w-7"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(product.id.toString())}
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium text-gray-900">
                  ${totals.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">
                  ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Checkout
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </>
      )}

      {isCheckoutOpen && (
        <Checkout
          products={products as CheckoutProduct[]}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleCheckout}
          clearCart={clearCart}
        />
      )}
    </div>
  )
} 