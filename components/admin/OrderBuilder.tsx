'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  title: string
  price: number
  category: string
  our_price?: number
}

interface OrderItem {
  product: Product
  quantity: number
  includesWarranty: boolean
  includesInstallation: boolean
}

export default function OrderBuilder() {
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToOrder = (product: Product) => {
    setOrderItems(prev => [
      ...prev,
      {
        product,
        quantity: 1,
        includesWarranty: false,
        includesInstallation: false
      }
    ])
  }

  const removeFromOrder = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ))
  }

  const toggleWarranty = (index: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, includesWarranty: !item.includesWarranty } : item
    ))
  }

  const toggleInstallation = (index: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, includesInstallation: !item.includesInstallation } : item
    ))
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      let itemTotal = (item.product.our_price || item.product.price) * item.quantity
      if (item.includesWarranty) itemTotal += 199
      if (item.includesInstallation) itemTotal += 299
      return total + itemTotal
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Products List */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Available Products</h3>
          <p className="text-sm text-gray-500">Click to add to order</p>
        </div>
        <div className="space-y-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToOrder(product)}
              className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200"
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h4 className="text-sm font-medium text-gray-900">{product.title}</h4>
                  <p className="text-sm text-gray-500">
                    ${(product.our_price || product.price).toFixed(2)}
                  </p>
                </div>
                <Plus className="w-5 h-5 text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
          <p className="text-sm text-gray-500">Review and customize your order</p>
        </div>
        
        {orderItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items in order</h3>
            <p className="mt-1 text-sm text-gray-500">Add some products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{item.product.title}</h4>
                    <p className="text-sm text-gray-500">
                      ${(item.product.our_price || item.product.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromOrder(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.includesWarranty}
                      onChange={() => toggleWarranty(index)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Add Warranty (+$199)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.includesInstallation}
                      onChange={() => toggleInstallation(index)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Add Installation (+$299)</span>
                  </label>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900">Subtotal</span>
                    <span className="text-gray-900">
                      ${(item.product.our_price || item.product.price) * item.quantity +
                        (item.includesWarranty ? 199 : 0) +
                        (item.includesInstallation ? 299 : 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-lg font-medium text-gray-900">
                <span>Total</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>

            <Button className="w-full mt-4">
              Create Order
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 