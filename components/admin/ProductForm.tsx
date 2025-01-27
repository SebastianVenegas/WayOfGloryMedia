'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, ImagePlus } from 'lucide-react'

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
  onCancel?: () => void
  initialData?: FormData
  isEditing?: boolean
}

export default function ProductForm({ onSubmit, onCancel, initialData, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    category: initialData?.category || '',
    image_url: initialData?.image_url || '',
    features: initialData?.features || [],
    included_items: initialData?.included_items || [],
    warranty_info: initialData?.warranty_info || '',
    installation_available: initialData?.installation_available || false,
    technical_details: initialData?.technical_details || {
      resolution: '',
      frameRate: '',
      audioQuality: '',
      connectivity: '',
      powerRequirements: '',
      dimensions: '',
      weight: ''
    },
    images: initialData?.images || []
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_: string, i: number) => i !== index)
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const handleIncludedItemChange = (index: number, value: string) => {
    const newIncludedItems = [...formData.included_items]
    newIncludedItems[index] = value
    setFormData(prev => ({ ...prev, included_items: newIncludedItems }))
  }

  const addIncludedItem = () => {
    setFormData(prev => ({ ...prev, included_items: [...prev.included_items, ''] }))
  }

  const removeIncludedItem = (index: number) => {
    const newIncludedItems = formData.included_items.filter((_: string, i: number) => i !== index)
    setFormData(prev => ({ ...prev, included_items: newIncludedItems }))
  }

  const handleTechnicalDetailChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      technical_details: {
        ...prev.technical_details,
        [key]: value
      }
    }))
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  const addImage = () => {
    if (formData.images.length < 5) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ''] }))
    }
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_: string, i: number) => i !== index)
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <Input
                type="text"
                value={formData.title}
                onChange={handleChange}
                name="title"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <Input
                type="number"
                value={formData.price}
                onChange={handleChange}
                name="price"
                required
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={handleChange}
              name="description"
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={handleChange}
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="individual">Individual Product</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <Input
                  type="text"
                  value={formData.image_url}
                  onChange={handleChange}
                  name="image_url"
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => {/* TODO: Implement image upload */}}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Features</h3>
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
          
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder="Enter feature"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFeature(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Technical Details */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Technical Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.technical_details).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <Input
                  type="text"
                  value={value as string}
                  onChange={(e) => handleTechnicalDetailChange(key, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Included Items */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Included Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addIncludedItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {formData.included_items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => handleIncludedItemChange(index, e.target.value)}
                placeholder="Enter included item"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIncludedItem(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Warranty Information</label>
            <textarea
              value={formData.warranty_info}
              onChange={handleChange}
              name="warranty_info"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.installation_available}
              onChange={handleCheckboxChange}
              name="installation_available"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Installation Available
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Product Images (Up to 5)
          </label>
          {formData.images.map((image, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={image}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          {formData.images.length < 5 && (
            <button
              type="button"
              onClick={addImage}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Add Image
            </button>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
} 