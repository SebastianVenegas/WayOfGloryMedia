'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductForm from './ProductForm'

interface Product {
  id: number
  title: string
  description?: string
  price: number
  category: string
  image_url?: string
  features?: string[]
  included_items?: string[]
  warranty_info?: string
  installation_available?: boolean
  technical_details?: Record<string, string>
  created_at: string
  updated_at: string
  images?: { image_url: string }[]
}

interface FormData {
  title: string
  description: string
  price: string
  category: string
  image_url?: string
  features: string[]
  included_items: string[]
  warranty_info: string
  installation_available: boolean
  technical_details: Record<string, string>
  images: string[]
}

interface ProductFormProps {
  onSubmit: (data: FormData) => void
  initialData?: FormData
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
      setIsLoading(false)
    } catch (error) {
      setError('Failed to load products')
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      if (!response.ok) throw new Error('Failed to add product')
      
      await fetchProducts()
      setShowForm(false)
    } catch (error) {
      setError('Failed to add product')
    }
  }

  const handleEditProduct = async (formData: FormData) => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      if (!response.ok) throw new Error('Failed to update product')
      
      await fetchProducts()
      setSelectedProduct(null)
    } catch (error) {
      setError('Failed to update product')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete product')
      
      await fetchProducts()
    } catch (error) {
      setError('Failed to delete product')
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <ProductForm
            onSubmit={handleAddProduct}
          />
          <button
            onClick={() => setShowForm(false)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {selectedProduct && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
          <ProductForm
            onSubmit={handleEditProduct}
            initialData={{
              title: selectedProduct.title,
              description: selectedProduct.description || '',
              price: selectedProduct.price.toString(),
              category: selectedProduct.category,
              image_url: selectedProduct.image_url || '',
              features: selectedProduct.features || [],
              included_items: selectedProduct.included_items || [],
              warranty_info: selectedProduct.warranty_info || '',
              installation_available: selectedProduct.installation_available || false,
              technical_details: selectedProduct.technical_details || {},
              images: selectedProduct.images?.map(img => img.image_url) || []
            }}
          />
          <button
            onClick={() => setSelectedProduct(null)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <img
                src={product.image_url || '/placeholder.jpg'}
                alt={product.title}
                className="object-cover rounded-md w-full h-full"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
            <p className="text-gray-600 mb-2">${product.price.toFixed(2)}</p>
            <p className="text-gray-500 mb-4">{product.category}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedProduct(product)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 