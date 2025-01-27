'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Package, Plus, X, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Feature {
  id: string
  text: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [features, setFeatures] = useState<Feature[]>([{ id: '1', text: '' }])
  const [includedItems, setIncludedItems] = useState<Feature[]>([{ id: '1', text: '' }])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [installationAvailable, setInstallationAvailable] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAddFeature = () => {
    setFeatures([...features, { id: Date.now().toString(), text: '' }])
  }

  const handleAddIncludedItem = () => {
    setIncludedItems([...includedItems, { id: Date.now().toString(), text: '' }])
  }

  const handleRemoveFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id))
  }

  const handleRemoveIncludedItem = (id: string) => {
    setIncludedItems(includedItems.filter(i => i.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const productData = {
        title: formData.get('title'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category'),
        features: features.map(f => f.text).filter(Boolean),
        included_items: includedItems.map(i => i.text).filter(Boolean),
        warranty_info: formData.get('warranty_info'),
        installation_available: installationAvailable,
        technical_details: {
          // Add any technical details you want to capture
        }
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        router.push('/admin/products')
      } else {
        throw new Error('Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      // Handle error (show error message to user)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new product by filling out the information below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Product Title
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Enter product title"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="price"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Price
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Enter product description"
              className="h-32"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="category"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select a category</option>
              <optgroup label="Audio Gear">
                <option value="Audio Gear/Mixers">Mixers</option>
                <option value="Audio Gear/Mics">Mics</option>
                <option value="Audio Gear/Stands">Stands</option>
                <option value="Audio Gear/Cables">Cables</option>
                <option value="Audio Gear/Snakes">Snakes</option>
                <option value="Audio Gear/Speakers">Speakers</option>
                <option value="Audio Gear/IEMS">IEMS</option>
              </optgroup>
              <option value="Streaming Gear">Streaming Gear</option>
              <option value="Services">Services</option>
            </select>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Features</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFeature}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={feature.id} className="flex gap-2">
                <Input
                  value={feature.text}
                  onChange={(e) => {
                    const newFeatures = [...features]
                    newFeatures[index].text = e.target.value
                    setFeatures(newFeatures)
                  }}
                  placeholder="Enter feature"
                />
                {features.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFeature(feature.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Included Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Included Items</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddIncludedItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {includedItems.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <Input
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...includedItems]
                    newItems[index].text = e.target.value
                    setIncludedItems(newItems)
                  }}
                  placeholder="Enter included item"
                />
                {includedItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIncludedItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>

          <div className="space-y-2">
            <label
              htmlFor="warranty_info"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Warranty Information
            </label>
            <Textarea
              id="warranty_info"
              name="warranty_info"
              placeholder="Enter warranty information"
              className="h-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={installationAvailable}
              onCheckedChange={setInstallationAvailable}
            />
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Installation Available
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Image</h2>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
} 