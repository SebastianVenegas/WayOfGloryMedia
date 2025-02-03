'use client'

import * as React from "react"
import { X, ChevronLeft, ChevronRight, Package, Check, ZoomIn, Plus, Minus, Star, StarHalf } from "lucide-react"
import { useState } from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToBundle?: (product: {
    id: string
    title: string
    description: string
    price: number
    category: string
    image_url?: string
    features?: string[]
    included_items?: string[]
    warranty_info?: string
    installation_available?: boolean
    technical_details?: Record<string, string>
    images?: { image_url: string }[]
    our_price?: number
    quantity: number
  }) => void
  selectedProduct: {
    id: string
    title: string
    description: string
    price: number
    category: string
    image_url?: string
    features?: string[]
    included_items?: string[]
    warranty_info?: string
    installation_available?: boolean
    technical_details?: Record<string, string>
    images?: { image_url: string }[]
    our_price?: number
  }
}

const TAX_RATE = 0.0775 // 7.75% for Riverside, CA

const calculateTax = (price: number): number => {
  return price * TAX_RATE
}

const calculateTotalWithTax = (price: number): number => {
  return price * (1 + TAX_RATE)
}

export default function ProductModal({ isOpen, onClose, onAddToBundle, selectedProduct }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  const images = selectedProduct.images?.length 
    ? selectedProduct.images.map(img => img.image_url)
    : selectedProduct.image_url 
      ? [selectedProduct.image_url] 
      : []

  const price = typeof selectedProduct.price === 'string' 
    ? parseFloat(selectedProduct.price) 
    : selectedProduct.price

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount))
  }

  const handleAddToBundle = () => {
    if (onAddToBundle) {
      onAddToBundle({ 
        ...selectedProduct, 
        quantity: quantity // Pass the selected quantity
      })
    }
    onClose()
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const renderStars = (rating: number = 4.5) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`star-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
      )
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half-star" className="w-4 h-4 fill-amber-400 text-amber-400" />
      )
    }

    const remainingStars = 5 - stars.length
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} className="w-4 h-4 text-gray-200" />
      )
    }

    return stars
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[9998]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 m-auto w-[95vw] h-[90vh] max-w-6xl bg-white rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-500">{selectedProduct.category}</span>
                    <div className="flex items-center gap-1">
                      {renderStars()}
                      <span className="text-sm text-gray-500 ml-1">4.5 (128 reviews)</span>
                    </div>
                  </div>
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full grid lg:grid-cols-2">
                {/* Left Column - Images (Fixed) */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-xl bg-white overflow-hidden group border border-gray-200">
                      {images[selectedImageIndex] ? (
                        <>
                          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Image
                              src={images[selectedImageIndex]}
                              alt={selectedProduct.title}
                              fill
                              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                              onLoadingComplete={(img) => {
                                const parent = img.parentElement?.parentElement;
                                if (parent) {
                                  parent.querySelector('.animate-pulse')?.classList.add('hidden');
                                }
                              }}
                            />
                          </div>
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  previousImage()
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <ChevronLeft className="h-6 w-6 text-gray-700" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  nextImage()
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <ChevronRight className="h-6 w-6 text-gray-700" />
                              </button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsPreviewOpen(true)}
                            className="absolute bottom-4 right-4 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={cn(
                              "relative aspect-square rounded-lg overflow-hidden group border border-gray-200",
                              selectedImageIndex === index && "ring-2 ring-blue-500"
                            )}
                          >
                            <Image
                              src={image}
                              alt={`${selectedProduct.title} ${index + 1}`}
                              fill
                              className="object-contain p-2 transition-transform duration-200 group-hover:scale-110"
                            />
                            {selectedImageIndex !== index && (
                              <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors duration-200" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Details (Scrollable) */}
                <div className="overflow-y-auto border-l border-gray-200">
                  <div className="p-6 space-y-6">
                    {/* Price Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Price</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-900">
                              ${(selectedProduct.our_price || selectedProduct.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange(1)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-blue-600">
                          ${(selectedProduct.our_price ? Number(selectedProduct.our_price) : Number(selectedProduct.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm text-gray-500">
                          + ${calculateTax(selectedProduct.our_price ? Number(selectedProduct.our_price) : Number(selectedProduct.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tax
                        </span>
                      </div>

                      <Button 
                        size="default"
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        onClick={handleAddToBundle}
                      >
                        Add to Bundle
                      </Button>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-900">Description</h3>
                      <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                    </div>

                    {/* Features */}
                    {selectedProduct.features && selectedProduct.features.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-900">Features</h3>
                        <ul className="space-y-3">
                          {selectedProduct.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <div className="text-blue-500">
                                <Check className="h-5 w-5" />
                              </div>
                              <span className="text-gray-600 text-base">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical Details */}
                    {selectedProduct.technical_details && Object.keys(selectedProduct.technical_details).length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900">Technical Specifications</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-gray-50 rounded-xl p-4">
                          {Object.entries(selectedProduct.technical_details).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <dt className="text-xs text-gray-500">{key}</dt>
                              <dd className="text-sm font-medium text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Included Items */}
                    {selectedProduct.included_items && selectedProduct.included_items.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900">What's Included</h3>
                        <ul className="grid gap-2">
                          {selectedProduct.included_items.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-sm text-gray-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warranty Info */}
                    {selectedProduct.warranty_info && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900">Warranty Information</h3>
                        <p className="text-sm text-gray-600">{selectedProduct.warranty_info}</p>
                      </div>
                    )}

                    {/* Installation Available */}
                    {selectedProduct.installation_available && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Check className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Professional Installation Available</p>
                            <p className="text-sm text-blue-700 mt-1">Our expert team will ensure optimal setup and configuration for your space.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}