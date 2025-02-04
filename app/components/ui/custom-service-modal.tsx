import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, Sparkles, Plus, Save } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

type CustomService = {
  id?: string
  title: string
  description: string
  price: number | string
  features: string[]
  category: string
  is_custom: boolean
  created_at?: string
  updated_at?: string
  quantity?: number
  skip_tax?: boolean
}

export type { CustomService }

interface CustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: CustomService) => void
  initialData?: CustomService
}

export default function CustomServiceModal({ isOpen, onClose, onSave, initialData }: CustomServiceModalProps) {
  const [isImproving, setIsImproving] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CustomService>(initialData || {
    title: "",
    description: "",
    price: 0,
    features: [""],
    category: "Services",
    is_custom: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      })
      return
    }
    
    const serviceData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    }
    
    await onSave(serviceData)
    onClose()
  }

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      (typeof formData.price === 'string' ? parseFloat(formData.price) > 0 : formData.price > 0) &&
      formData.features.some(f => f.trim() !== '')
    )
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const handleImproveService = async () => {
    if (!formData.title && !formData.description) {
      toast({
        title: "No Content",
        description: "Please add some content to improve",
        variant: "destructive",
      })
      return
    }

    setIsImproving(true)
    try {
      const response = await fetch('/api/admin/enhance-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          features: formData.features.filter(f => f.trim() !== ''),
          price: formData.price,
          category: formData.category
        })
      })

      if (!response.ok) throw new Error('Failed to enhance service')

      const enhanced = await response.json()
      
      setFormData(prev => ({
        ...prev,
        title: enhanced.title || prev.title,
        description: enhanced.description || prev.description,
        features: enhanced.features?.length ? enhanced.features : prev.features,
        price: enhanced.price || prev.price
      }))

      toast({
        title: "Service Enhanced",
        description: "Your service has been professionally improved!",
      })
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImproving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 bg-gradient-to-b from-white to-gray-50/50 rounded-2xl border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {initialData ? 'Edit Custom Service' : 'Create Custom Service'}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                Fill in the details below to {initialData ? 'update' : 'create'} a custom service
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Service Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Premium Audio Setup"
                  className="bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="pl-8 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your service in detail..."
                className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Features</label>
                <Button
                  type="button"
                  onClick={addFeature}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Feature
                </Button>
              </div>
              <motion.div layout className="space-y-3">
                {formData.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-2"
                  >
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                      className="flex-1 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      onClick={() => removeFeature(index)}
                      variant="ghost"
                      size="icon"
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50/80">
            <Button
              type="button"
              onClick={handleImproveService}
              variant="outline"
              disabled={isImproving}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              {isImproving ? (
                <>Improving...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve with AI
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="text-gray-600 hover:text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Service
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 