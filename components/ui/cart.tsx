'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./button"
import { ShoppingCart, X, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { Checkout } from './checkout'

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  image: string
  addons?: {
    warranty: boolean
    installation: boolean
  }
}

interface CartProps {
  items: CartItem[]
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onClose: () => void
  isOpen: boolean
}

export function Cart({ items, onRemove, onUpdateQuantity, onClose, isOpen }: CartProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const clearCart = () => {
    // Remove all items from cart
    items.forEach(item => onRemove(item.id))
  }

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false)
    onClose() // Close the cart after checkout is closed
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && !isCheckoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Cart is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Start adding some items to your cart.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.title}</h3>
                            <p className="ml-4">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="rounded-md p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-gray-600">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="rounded-md p-1 text-gray-400 hover:text-gray-500"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => onRemove(item.id)}
                              className="font-medium text-[#1a365d] hover:text-[#1e4976]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-xl font-semibold text-[#1a365d]">
                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-[#1a365d] hover:bg-[#1e4976] text-white py-6 font-medium
                           transition-all duration-150 shadow-sm hover:shadow-md rounded-xl"
                  disabled={items.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout 
            cartItems={items} 
            onClose={handleCheckoutClose}
            clearCart={clearCart}
          />
        )}
      </AnimatePresence>
    </>
  )
} 