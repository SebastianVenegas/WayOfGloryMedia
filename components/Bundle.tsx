"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ShoppingBag, X, Plus, Minus, ChevronRight, ChevronLeft, Package, Trash2, AlertCircle, Mic2, Sliders, Cable, Network, Speaker, Headphones, Maximize2, WrenchIcon, Mail } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Checkout, { CheckoutFormData } from './Checkout'
import { Input } from '@/components/ui/input'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'
import { productImages } from '@/lib/product-images'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-custom"

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

interface BundleProps {
  products: BundleItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  clearCart?: () => void;
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

export default function Bundle({ products, onRemove, onUpdateQuantity, isOpen, setIsOpen, clearCart }: BundleProps) {
  const { toast } = useToast()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [quoteEmail, setQuoteEmail] = useState('')
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false)
  const [installationSelected, setInstallationSelected] = useState(false)
  const [installationPrice, setInstallationPrice] = useState(0)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [width, setWidth] = useState(280)
  const dragRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  const totalPrice = products.reduce((sum, product) => 
    sum + (product.our_price || product.price) * product.quantity, 0
  )

  useEffect(() => {
    document.documentElement.style.setProperty('--cart-width', `${width}px`)
  }, [width])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current && dragRef.current.dataset.dragging === 'true') {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= 280 && newWidth <= 500) {
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

      // Log the data being sent
      console.log('Sending contract data:', {
        formData,
        products,
        totalAmount,
        paymentPlan: formData.paymentPlan,
        dueToday: formData.dueToday || totalAmount
      });

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
          paymentPlan: formData.paymentPlan || 'full',
          dueToday: formData.dueToday || totalAmount,
          totalDueAfterFirst: formData.totalDueAfterFirst || 0,
          paymentFrequency: formData.paymentFrequency || 'Monthly',
          signature: formData.signature || '',
          contractNumber: formData.contractNumber,
          order_creator: formData.firstName + ' ' + formData.lastName,
          products: products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            our_price: product.our_price,
            quantity: product.quantity,
            is_custom: product.is_custom,
            is_service: product.is_service,
            category: product.category
          })),
          productSubtotal: productSubtotal,
          tax: tax,
          installationPrice: installationAmount,
          totalAmount: totalAmount
        })
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      // Log the parsed response for debugging
      console.log('Contract API Response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create contract');
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
      if (clearCart) clearCart();
      setIsCheckoutOpen(false);
      setIsOpen(false);
      return data;
    } catch (error) {
      console.error('Error creating contract:', error);
      
      // Error toast with more detailed message
      toast({
        title: "Error Creating Contract",
        description: error instanceof Error 
          ? `Error: ${error.message}. Please try again or contact support if the issue persists.`
          : "Failed to create contract. Please try again or contact support if the issue persists.",
        variant: "destructive",
        duration: 7000,
        className: "border-red-100",
      });
      throw error;
    }
  };

  const handleGenerateQuote = async () => {
    if (!quoteEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the quote to.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingQuote(true)
    try {
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            our_price: product.our_price,
            quantity: product.quantity,
            category: product.category,
            is_service: product.is_service,
            is_custom: product.is_custom
          })),
          email: quoteEmail,
          installationPrice: installationSelected ? installationPrice : 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quote');
      }

      toast({
        title: "Quote Sent Successfully! 📧",
        description: `A quote has been sent to ${quoteEmail}. Please check your email.`,
        variant: "default",
        duration: 5000,
        className: "bg-white border-green-100 text-green-900",
      });

      setIsQuoteDialogOpen(false);
      setQuoteEmail('');
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Failed to Generate Quote",
        description: error instanceof Error ? error.message : "An error occurred while generating the quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-700">Bundle</h2>
            {products.length > 0 && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {products.length}
              </span>
            )}
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
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium mb-2 text-gray-700">Your bundle is empty</h3>
              <p className="text-sm text-gray-500">Add some products to get started</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    "group bg-gray-50/50 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all p-3",
                    isRemoving === product.id && "opacity-50 scale-95"
                  )}
                >
                  <div className="flex gap-2">
                    {product.category === 'Services' ? (
                      <div className="relative w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <WrenchIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    ) : (
                      <div className="relative h-12 w-12 rounded-lg bg-white overflow-hidden border border-gray-100 flex-shrink-0">
                        <Image
                          src={getProductImage(product)}
                          alt={product.title}
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium line-clamp-2 pr-2">
                          {product.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(product.id)}
                          className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 -mr-1 h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, product.quantity - 1)}
                            disabled={product.quantity <= 1}
                            className="h-6 w-6 rounded-md bg-white/5 hover:bg-white/10 flex-shrink-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {product.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, product.quantity + 1)}
                            className="h-6 w-6 rounded-md bg-white/5 hover:bg-white/10 flex-shrink-0"
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
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 p-4 space-y-4">
            {/* Installation Option */}
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <label className="flex items-center gap-2 text-sm flex-1">
                <input 
                  type="checkbox" 
                  className="rounded-md border-gray-200 text-gray-700 focus:ring-gray-200 w-4 h-4"
                  checked={installationSelected}
                  onChange={(e) => setInstallationSelected(e.target.checked)}
                />
                <span className="text-gray-600">Installation Service</span>
              </label>
              {installationSelected && (
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={installationPrice}
                    onChange={(e) => setInstallationPrice(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-8 text-sm bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-100 rounded-md"
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
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sales Tax</span>
                <span className="text-gray-700">
                  ${(products.reduce((sum, item) => {
                    if (item.category === 'Services' || item.category === 'Services/Custom' || item.is_service || item.is_custom) {
                      return sum;
                    }
                    return sum + ((item.our_price || item.price) * item.quantity);
                  }, 0) * 0.0775).toFixed(2)}
                </span>
              </div>
              {installationSelected && installationPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Installation</span>
                  <span className="text-gray-700">${installationPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">
                  ${(
                    totalPrice + 
                    (products.reduce((sum, item) => {
                      if (item.category === 'Services' || item.category === 'Services/Custom' || item.is_service || item.is_custom) {
                        return sum;
                      }
                      return sum + ((item.our_price || item.price) * item.quantity);
                    }, 0) * 0.0775) + 
                    (installationSelected ? installationPrice : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-700 rounded-lg h-9 text-sm"
                onClick={() => setIsQuoteDialogOpen(true)}
              >
                Get Quote
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-sm"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Checkout
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 pt-1">
              Tax will be calculated based on your location
            </p>
          </div>
        )}
      </div>

      {/* Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-500" />
              <span>Generate Quote</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-base font-medium text-gray-700">
                Email Address
              </label>
              <Input
                type="email"
                value={quoteEmail}
                onChange={(e) => setQuoteEmail(e.target.value)}
                placeholder="Enter email address"
                className="h-14 text-base rounded-xl"
              />
            </div>
            <Button
              onClick={handleGenerateQuote}
              disabled={isGeneratingQuote || !quoteEmail}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-medium"
            >
              {isGeneratingQuote ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
                  Generating...
                </>
              ) : (
                'Send Quote'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout
            products={products.map(product => ({
              id: Number(product.id),
              title: product.title,
              price: product.price,
              our_price: product.our_price,
              category: product.category,
              quantity: product.quantity,
              description: product.description,
              technical_details: product.technical_details,
              features: product.features,
              included_items: product.included_items,
              warranty_info: product.warranty_info,
              installation_available: product.installation_available,
              is_service: product.is_service,
              is_custom: product.is_custom
            }))}
            onClose={() => setIsCheckoutOpen(false)}
            onSubmit={handleCheckout}
            installationPrice={installationSelected ? installationPrice : 0}
            clearCart={clearCart || (() => {})}
          />
        )}
      </AnimatePresence>
    </>
  )
} 