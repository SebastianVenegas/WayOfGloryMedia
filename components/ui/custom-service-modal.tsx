import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Package, X, ArrowRight, DollarSign, Wand2, Edit, Eye, Plus, Save, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface CustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: CustomService) => void
}

interface CustomService {
  id?: string
  title: string
  description: string
  price: number
  features: string[]
  category: string
  is_custom: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function CustomServiceModal({ isOpen, onClose, onSave }: CustomServiceModalProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CustomService>({
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
    
    setFormData({
      title: "",
      description: "",
      price: 0,
      features: [""],
      category: "Services",
      is_custom: true
    })
    onClose()
  }

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.price > 0 &&
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
          features: formData.features.filter(f => f.trim()),
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
        features: enhanced.features || prev.features,
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

  const handleGenerateService = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the service you want to create.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/generate-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })

      if (!response.ok) throw new Error('Failed to generate service')

      const generated = await response.json()
      setFormData({
        title: generated.title || '',
        description: generated.description || '',
        features: generated.features || [''],
        price: generated.price || 0,
        category: 'Services',
        is_custom: true
      })
      setActiveTab('edit')

      toast({
        title: "Service Generated",
        description: "Your service has been created! Feel free to make any adjustments.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 bg-white rounded-2xl border-none shadow-2xl">
        <DialogHeader className="relative p-6 pb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-500"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col items-start space-y-4">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Custom Service
            </span>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {activeTab === 'ai' ? 'Generate Service with AI' : 
               activeTab === 'edit' ? 'Create Custom Service' :
               'Preview Service'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
              {[
                { id: 'ai', icon: Wand2, label: 'AI Generate' },
                { id: 'edit', icon: Edit, label: 'Edit' },
                { id: 'preview', icon: Eye, label: 'Preview' }
              ].map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all",
                    "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm",
                    "data-[state=active]:scale-[0.98] hover:bg-white/50",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="ai" className="mt-0 space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the service you want to create..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[150px] resize-none bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  onClick={handleGenerateService}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isGenerating ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Service
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="pl-9 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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

                <div className="flex items-center justify-between pt-6 border-t">
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
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Service
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="bg-gray-50/50 rounded-xl p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">{formData.title || 'Untitled Service'}</h3>
                  <p className="text-gray-600">{formData.description || 'No description provided.'}</p>
                </div>

                {formData.features.filter(f => f.trim()).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Features</h4>
                    <ul className="space-y-2">
                      {formData.features.filter(f => f.trim()).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-600">
                          <ArrowRight className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${formData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 