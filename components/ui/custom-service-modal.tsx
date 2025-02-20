import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, Sparkles, Plus, Save, Clock, Check, DollarSign, Loader2, AlertCircle, Wand2, Eye, Edit, ArrowRight, Target, Zap, Users, Calendar, Tags, Lightbulb, Settings, PenTool, Palette, BarChart, Video, Radio, Scissors, Globe, Smartphone, Mic2, Code2, Headphones, GitMerge, ChevronDown, ChevronUp, Briefcase } from "lucide-react"
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CustomService, ServiceCategory, ServiceTier, ServiceDuration, ServiceMetadata, ServiceFormData } from "@/app/types/custom-service"

// Animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const slideIn = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

interface ServiceTemplate {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: ServiceCategory
  features?: string[]
  metadata?: Partial<ServiceMetadata>
}

// Service categories with icons, descriptions, and specialized AI prompts
const SERVICE_CATEGORIES: {
  id: ServiceCategory
  icon: LucideIcon
  label: string
  description: string
  aiPrompt: string
  suggestedStyle: 'creative' | 'professional' | 'technical'
}[] = [
  {
    id: 'Audio',
    icon: Headphones,
    label: 'Audio Services',
    description: 'Professional audio recording and production',
    aiPrompt: "Create a professional audio service with industry-standard equipment, focusing on high-quality sound production, post-processing capabilities, and professional studio standards. Include specific technical requirements and delivery formats.",
    suggestedStyle: 'technical'
  },
  {
    id: 'Video',
    icon: Video,
    label: 'Video Services',
    description: 'High-quality video production and editing',
    aiPrompt: "Create a professional video production service with 4K capabilities, including pre-production planning, professional filming, post-production editing, color grading, and motion graphics. Specify equipment requirements and delivery formats.",
    suggestedStyle: 'professional'
  },
  {
    id: 'Lighting',
    icon: Zap,
    label: 'Lighting',
    description: 'Professional lighting setup and rental',
    aiPrompt: "Create a professional lighting service with modern LED technology, including setup, rigging, DMX control, and power distribution. Include equipment specifications and safety requirements.",
    suggestedStyle: 'technical'
  },
  {
    id: 'Equipment',
    icon: Settings,
    label: 'Equipment',
    description: 'Professional gear rental and setup',
    aiPrompt: "Create a professional equipment rental service with high-end gear, including delivery, setup, technical support, and maintenance. Specify insurance requirements and handling procedures.",
    suggestedStyle: 'professional'
  },
  {
    id: 'Software',
    icon: Code2,
    label: 'Software',
    description: 'Custom software development',
    aiPrompt: "Create a custom software development service focusing on scalable solutions, modern architecture, and best coding practices. Include development methodology, tech stack, and maintenance plans.",
    suggestedStyle: 'technical'
  },
  {
    id: 'Web Development',
    icon: Globe,
    label: 'Web Dev',
    description: 'Professional web development',
    aiPrompt: "Create a professional web development service with modern frameworks, responsive design, SEO optimization, and performance tuning. Include hosting, maintenance, and security considerations.",
    suggestedStyle: 'technical'
  },
  {
    id: 'Mobile Apps',
    icon: Smartphone,
    label: 'Mobile Apps',
    description: 'iOS and Android development',
    aiPrompt: "Create a professional mobile app development service for iOS and Android platforms, focusing on native performance, user experience, and app store compliance. Include testing, deployment, and maintenance plans.",
    suggestedStyle: 'technical'
  },
  {
    id: 'Consulting',
    icon: Lightbulb,
    label: 'Consulting',
    description: 'Expert technical consulting',
    aiPrompt: "Create a professional technical consulting service with expertise assessment, solution architecture, and implementation guidance. Include project management methodology and deliverables.",
    suggestedStyle: 'professional'
  }
]

// Main service templates
const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Audio Services
  {
    id: 'audio-setup',
    title: 'Audio Setup & Installation',
    description: 'Professional audio equipment setup and configuration service',
    icon: Sparkles,
    category: 'Audio',
    features: [
      'Professional equipment setup',
      'Acoustic optimization',
      'System calibration',
      'Cable management',
      'Testing and verification'
    ],
    metadata: {
      tier: 'Standard',
      duration: 'Project-based',
      tags: ['setup', 'installation', 'audio']
    }
  }
]

type CategoryFilter = ServiceCategory | 'All'

interface CustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: CustomService) => void
  initialData?: CustomService
  showTabs?: boolean
}

export default function CustomServiceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  showTabs = true 
}: CustomServiceModalProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [isImproving, setIsImproving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isTabsVisible, setIsTabsVisible] = useState(showTabs)
  const { toast } = useToast()
  
  const defaultFormData: ServiceFormData = {
    title: "",
    description: "",
    price: 0,
    features: [""],
    category: "Audio",
    is_custom: true,
    metadata: {
      tier: "Standard",
      duration: "Hourly",
      tags: []
    }
  }
  
  const [formData, setFormData] = useState<ServiceFormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        category: initialData.category as ServiceCategory,
        metadata: {
          ...initialData.metadata,
          tier: (initialData.metadata?.tier || "Standard") as ServiceTier,
          duration: (initialData.metadata?.duration || "Hourly") as ServiceDuration
        }
      }
    }
    return defaultFormData
  })

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [generationStyle, setGenerationStyle] = useState<'creative' | 'professional' | 'technical'>('professional')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All')
  
  // Track changes
  useEffect(() => {
    if (!initialData) {
      setHasChanges(
        formData.title !== "" ||
        formData.description !== "" ||
        formData.price !== 0 ||
        formData.features.some(f => f !== "")
      )
    } else {
      setHasChanges(
        formData.title !== initialData.title ||
        formData.description !== initialData.description ||
        formData.price !== initialData.price ||
        JSON.stringify(formData.features) !== JSON.stringify(initialData.features)
      )
    }
  }, [formData, initialData])

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
    
    setIsSaving(true)
    try {
      const serviceData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== "")
      }
    
      await onSave(serviceData)
      toast({
        title: "Success!",
        description: `Service successfully ${initialData ? 'updated' : 'created'}`,
      })
      
      // Reset form data to initial state
      setFormData({
        title: "",
        description: "",
        price: 0,
        features: [""],
        category: "Audio",
        is_custom: true,
        metadata: {
          tier: "Standard",
          duration: "Hourly",
          tags: []
        }
      })
      
      // Reset other states
      setAiPrompt('')
      setSelectedTemplate(null)
      setGenerationStyle('professional')
      setShowAdvancedOptions(false)
      
      // Close the modal
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${initialData ? 'update' : 'create'} the service. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
    if (formData.features.length >= 10) {
      toast({
        title: "Limit Reached",
        description: "Maximum of 10 features allowed",
        variant: "destructive",
      })
      return
    }
    
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const removeFeature = (index: number) => {
    if (formData.features.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one feature is required",
        variant: "destructive",
      })
      return
    }
    
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
          category: formData.category,
          metadata: formData.metadata,
          style: generationStyle,
          requirements: {
            includeMetadata: true,
            includeTags: true,
            includeFeatures: true,
            style: {
              creative: {
                tone: "innovative and engaging",
                focus: "unique value propositions and creative solutions"
              },
              professional: {
                tone: "formal and business-oriented",
                focus: "expertise and industry standards"
              },
              technical: {
                tone: "detailed and precise",
                focus: "technical specifications and capabilities"
              }
            }[generationStyle]
          }
        })
      })

      if (!response.ok) throw new Error('Failed to enhance service')

      const enhanced = await response.json()
      
      setFormData(prev => ({
        ...prev,
        title: enhanced.title || prev.title,
        description: enhanced.description || prev.description,
        features: enhanced.features?.length ? enhanced.features : prev.features,
        price: enhanced.price || prev.price,
        metadata: {
          ...prev.metadata,
          targetAudience: enhanced.metadata?.targetAudience || prev.metadata?.targetAudience,
          duration: enhanced.metadata?.duration || prev.metadata?.duration,
          tier: enhanced.metadata?.tier || prev.metadata?.tier,
          maxCapacity: enhanced.metadata?.maxCapacity || prev.metadata?.maxCapacity,
          tags: enhanced.metadata?.tags || prev.metadata?.tags,
          estimatedDuration: enhanced.metadata?.estimatedDuration || prev.metadata?.estimatedDuration
        }
      }))

      toast({
        title: "Service Enhanced",
        description: `Service improved in ${generationStyle} style!`,
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
    if (!aiPrompt.trim() && !selectedTemplate) {
      toast({
        title: "Input Required",
        description: "Please describe the service or select a template",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Extract client name if the prompt starts with "for" followed by a name
      const clientMatch = aiPrompt.match(/^for\s+([^,\.]+)/i);
      const isClientSpecific = !!clientMatch;
      const clientName = clientMatch ? clientMatch[1].trim() : null;
      
      // Find the selected category's configuration
      const categoryConfig = SERVICE_CATEGORIES.find(c => c.id === selectedCategory);
      
      // Modify the prompt to be more specific if it's for a client
      const processedPrompt = isClientSpecific
        ? aiPrompt.replace(/^for\s+([^,\.]+)/i, `Create a customized service specifically for ${clientName},`)
        : aiPrompt;

      // Build expertise context based on both category and style
      const expertiseContext = selectedCategory !== 'All' ? {
        role: `${selectedCategory} Service Expert with ${generationStyle} focus`,
        background: `Expert in ${selectedCategory.toLowerCase()} services with deep industry knowledge and ${generationStyle} approach`,
        focus: categoryConfig?.description || `Professional ${selectedCategory.toLowerCase()} services`,
        style: {
          creative: {
            expertise: "Creative direction and innovative solutions",
            approach: "Focus on unique and engaging service offerings"
          },
          professional: {
            expertise: "Business strategy and industry standards",
            approach: "Focus on professional excellence and market alignment"
          },
          technical: {
            expertise: "Technical specifications and implementation",
            approach: "Focus on detailed requirements and technical precision"
          }
        }[generationStyle]
      } : {
        role: `Professional Service Expert with ${generationStyle} focus`,
        background: `Expert in service design and delivery with ${generationStyle} approach`,
        focus: "Custom professional services",
        style: {
          creative: {
            expertise: "Creative service design",
            approach: "Innovative and engaging solutions"
          },
          professional: {
            expertise: "Professional service development",
            approach: "Industry-standard excellence"
          },
          technical: {
            expertise: "Technical service implementation",
            approach: "Precise and detailed specifications"
          }
        }[generationStyle]
      };

      const response = await fetch('/api/admin/generate-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: processedPrompt,
          template: selectedTemplate,
          style: generationStyle,
          category: selectedCategory,
          expertise: expertiseContext,
          metadata: {
            targetAudience: isClientSpecific ? clientName : formData.metadata?.targetAudience,
            estimatedDuration: formData.metadata?.estimatedDuration,
            tier: formData.metadata?.tier || "Standard",
            category: formData.category,
            duration: formData.metadata?.duration || "Hourly",
            maxCapacity: formData.metadata?.maxCapacity,
            tags: formData.metadata?.tags,
            isClientSpecific: isClientSpecific,
            clientName: clientName
          },
          requirements: {
            includeMetadata: true,
            includeTags: true,
            includeFeatures: true,
            isClientSpecific: isClientSpecific,
            clientName: clientName,
            style: {
              creative: {
                tone: isClientSpecific 
                  ? "personalized and innovative" 
                  : "creative and engaging",
                focus: isClientSpecific 
                  ? `unique solutions tailored for ${clientName}` 
                  : "distinctive value propositions and creative approaches"
              },
              professional: {
                tone: isClientSpecific 
                  ? "client-focused and polished" 
                  : "formal and business-oriented",
                focus: isClientSpecific 
                  ? `professional solutions for ${clientName}` 
                  : "industry best practices and professional standards"
              },
              technical: {
                tone: isClientSpecific 
                  ? "technically precise and specific" 
                  : "detailed and systematic",
                focus: isClientSpecific 
                  ? `technical specifications for ${clientName}` 
                  : "comprehensive technical requirements and specifications"
              }
            }[generationStyle]
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate service')

      const generated = await response.json()
      
      // Update all service details with AI-generated content
      setFormData({
        ...formData,
        title: isClientSpecific 
          ? `${generated.title} for ${clientName}` 
          : generated.title || '',
        description: generated.description || '',
        features: generated.features || [''],
        price: generated.price || 0,
        category: generated.category || formData.category,
        metadata: {
          targetAudience: isClientSpecific ? clientName : (generated.metadata?.targetAudience || formData.metadata?.targetAudience),
          duration: generated.metadata?.duration || formData.metadata?.duration,
          tier: generated.metadata?.tier || formData.metadata?.tier,
          maxCapacity: generated.metadata?.maxCapacity || formData.metadata?.maxCapacity,
          tags: isClientSpecific && clientName
            ? [...(generated.metadata?.tags || []), clientName.toLowerCase()]
            : generated.metadata?.tags || formData.metadata?.tags,
          estimatedDuration: generated.metadata?.estimatedDuration || formData.metadata?.estimatedDuration,
          isClientSpecific: isClientSpecific,
          clientName: clientName
        }
      })

      setActiveTab('edit')
      toast({
        title: "Service Generated",
        description: isClientSpecific 
          ? `Custom service created for ${clientName}. Review and adjust if needed.`
          : `Service generated in ${generationStyle} style. Review and adjust if needed.`,
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

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        // Reset all states
        setFormData({
          title: "",
          description: "",
          price: 0,
          features: [""],
          category: "Audio",
          is_custom: true,
          metadata: {
            tier: "Standard",
            duration: "Hourly",
            tags: []
          }
        })
        setActiveTab('edit')
        setAiPrompt('')
        setSelectedTemplate(null)
        setGenerationStyle('professional')
        setShowAdvancedOptions(false)
        setIsTabsVisible(showTabs)
        setHasChanges(false)
        onClose()
      }
    } else {
      // Reset all states
      setFormData({
        title: "",
        description: "",
        price: 0,
        features: [""],
        category: "Audio",
        is_custom: true,
        metadata: {
          tier: "Standard",
          duration: "Hourly",
          tags: []
        }
      })
      setActiveTab('edit')
      setAiPrompt('')
      setSelectedTemplate(null)
      setGenerationStyle('professional')
      setShowAdvancedOptions(false)
      setIsTabsVisible(showTabs)
      setHasChanges(false)
      onClose()
    }
  }

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category)
    
    // Find the selected category's configuration
    const categoryConfig = SERVICE_CATEGORIES.find(c => c.id === category)
    if (categoryConfig) {
      // Set the suggested generation style
      setGenerationStyle(categoryConfig.suggestedStyle)
      // Update the form data category
      setFormData(prev => ({
        ...prev,
        category: category,
        metadata: {
          ...prev.metadata,
          tags: [...(prev.metadata?.tags || []), category.toLowerCase()]
        }
      }))
    }
  }

  const handleTemplateSelect = (template: ServiceTemplate) => {
    setSelectedTemplate(template.id)
    setFormData(prev => ({
      ...prev,
      category: template.category,
      title: template.title,
      description: template.description
    }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate':
        return (
          <div className="p-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                {/* Category Selection */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Category</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {SERVICE_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border transition-all",
                          "hover:border-blue-300 hover:bg-blue-50/50",
                          selectedCategory === category.id
                            ? "border-blue-500 bg-blue-50/80 shadow-sm"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center mb-3",
                          "bg-gradient-to-br from-blue-50 to-blue-100",
                          selectedCategory === category.id && "from-blue-100 to-blue-200"
                        )}>
                          <category.icon className={cn(
                            "h-6 w-6",
                            selectedCategory === category.id
                              ? "text-blue-600"
                              : "text-blue-500"
                          )} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{category.label}</span>
                        <p className="text-xs text-gray-500 text-center mt-1">{category.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Generation */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedCategory !== 'All' 
                          ? `${selectedCategory} Service Generation` 
                          : 'Custom AI Generation'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedCategory !== 'All'
                          ? `Create a professional ${selectedCategory.toLowerCase()} service with AI assistance`
                          : 'Let AI create a custom service based on your needs'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {[
                        { id: 'creative', label: 'Creative', icon: PenTool },
                        { id: 'professional', label: 'Professional', icon: Briefcase },
                        { id: 'technical', label: 'Technical', icon: Settings }
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setGenerationStyle(style.id as 'creative' | 'professional' | 'technical')}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            "border hover:shadow-sm",
                            generationStyle === style.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                          )}
                        >
                          <style.icon className="h-4 w-4" />
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder={selectedCategory !== 'All' 
                      ? `Describe your ${selectedCategory.toLowerCase()} service requirements and specifications...`
                      : "Describe your service in detail..."
                    }
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[200px] resize-none bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300 rounded-xl text-base shadow-sm mb-4"
                  />

                  <Button
                    onClick={handleGenerateService}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-6 text-base font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        {selectedCategory !== 'All' 
                          ? `Generating ${selectedCategory} Service...`
                          : 'Generating Your Service...'
                        }
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-3" />
                        {selectedCategory !== 'All'
                          ? `Generate Professional ${selectedCategory} Service`
                          : 'Generate Professional Service'
                        }
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-6 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Service Benefits
                  </h3>
                  <ul className="space-y-4">
                    {[
                      {
                        icon: Clock,
                        title: "Quick Setup",
                        description: "Get your service ready in minutes"
                      },
                      {
                        icon: Target,
                        title: "Professional Standards",
                        description: "Industry-standard configurations"
                      },
                      {
                        icon: Users,
                        title: "Client-Focused",
                        description: "Tailored to your target audience"
                      },
                      {
                        icon: Settings,
                        title: "Fully Customizable",
                        description: "Adapt to your specific needs"
                      }
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">{benefit.title}</h4>
                          <p className="text-sm text-blue-700">{benefit.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {showAdvancedOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Advanced Options</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedOptions(false)}
                        className="h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Tier</label>
                        <select
                          value={formData.metadata?.tier || 'Standard'}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, tier: e.target.value as ServiceTier }
                          })}
                          className="w-full rounded-lg border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {['Basic', 'Standard', 'Premium', 'Custom'].map((tier) => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Duration Type</label>
                        <select
                          value={formData.metadata?.duration || 'Hourly'}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, duration: e.target.value as ServiceDuration }
                          })}
                          className="w-full rounded-lg border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {['Hourly', 'Daily', 'Weekly', 'Monthly', 'Project-based'].map((duration) => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location Type</label>
                        <select
                          value={formData.location_type || 'onsite'}
                          onChange={(e) => setFormData({
                            ...formData,
                            location_type: e.target.value as "onsite" | "remote" | "hybrid"
                          })}
                          className="w-full rounded-lg border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          {[
                            { value: 'onsite', label: 'On-site' },
                            { value: 'remote', label: 'Remote' },
                            { value: 'hybrid', label: 'Hybrid' }
                          ].map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tags</label>
                        <Input
                          value={formData.metadata?.tags?.join(', ') || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { 
                              ...formData.metadata, 
                              tags: e.target.value.split(',').map(t => t.trim()) 
                            }
                          })}
                          placeholder="e.g., professional, audio, studio"
                          className="bg-gray-50/50"
                        />
                        <p className="text-xs text-gray-500">Separate with commas</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );
      case 'edit':
        return (
          <div className="p-8 bg-gray-50/50">
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Service Title
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Premium Audio Setup"
                        className="h-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Price (USD)
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="number"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="h-10 pl-9 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Description
                      <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your service in detail..."
                      className="min-h-[120px] bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none hover:border-blue-300"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-500" />
                        Key Features
                        <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">Add up to 10 key features of your service</p>
                    </div>
                    <Button
                      type="button"
                      onClick={addFeature}
                      variant="outline"
                      size="sm"
                      disabled={formData.features.length >= 10}
                      className="h-9 px-4 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <motion.div layout className="space-y-3">
                      {formData.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          layout
                          initial={slideIn.initial}
                          animate={slideIn.animate}
                          exit={slideIn.exit}
                          className="flex gap-3"
                        >
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-medium text-sm">
                            {index + 1}
                          </div>
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder={`Feature ${index + 1}`}
                            className="h-10 flex-1 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300"
                          />
                          <Button
                            type="button"
                            onClick={() => removeFeature(index)}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Service Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleCategorySelect(e.target.value as ServiceCategory)}
                        className="h-10 w-full rounded-lg border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {['Audio', 'Video', 'Lighting', 'Equipment', 'Setup', 'Consulting', 'Other'].map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duration</label>
                      <select
                        value={formData.metadata?.duration || 'Hourly'}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, duration: e.target.value as ServiceDuration }
                        })}
                        className="h-10 w-full rounded-lg border-gray-200 bg-gray-50/50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {['Hourly', 'Daily', 'Weekly', 'Monthly', 'Project-based'].map((duration) => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Target Audience</label>
                      <Input
                        value={formData.metadata?.targetAudience || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, targetAudience: e.target.value }
                        })}
                        placeholder="e.g., Professional musicians"
                        className="h-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Maximum Capacity</label>
                      <Input
                        type="number"
                        value={formData.metadata?.maxCapacity || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, maxCapacity: parseInt(e.target.value) }
                        })}
                        placeholder="e.g., 50"
                        className="h-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <Input
                        value={formData.metadata?.tags?.join(', ') || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, tags: e.target.value.split(',').map(t => t.trim()) }
                        })}
                        placeholder="e.g., audio, live, professional"
                        className="h-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500">Separate with commas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <span className="text-sm text-yellow-600 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleImproveService}
                      variant="outline"
                      size="sm"
                      disabled={isImproving}
                      className="h-9 bg-white text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm"
                    >
                      {isImproving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Improve with AI
                        </>
                      )}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving || !hasChanges}
                      className={cn(
                        "h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
                        (!hasChanges || isSaving) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Service
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );
      case 'preview':
      default:
        return (
          <div className="p-8 bg-gray-50/50">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                <motion.div 
                  className="bg-white rounded-xl p-8 space-y-8 border border-gray-200 shadow-sm"
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  exit={fadeIn.exit}
                >
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-semibold text-gray-900">
                          {formData.title || 'Untitled Service'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-100">
                            {formData.category || 'Custom Service'}
                          </span>
                          {formData.metadata?.tier && (
                            <span className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
                              {formData.metadata.tier} Tier
                            </span>
                          )}
                          {formData.metadata?.duration && (
                            <span className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-full border border-purple-100">
                              {formData.metadata.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          ${typeof formData.price === 'string' ? parseFloat(formData.price).toFixed(2) : formData.price.toFixed(2)}
                          <span className="ml-1 text-sm font-medium text-gray-500">USD</span>
                        </div>
                        {formData.metadata?.duration && (
                          <span className="text-sm text-gray-500">per {formData.metadata.duration.toLowerCase()}</span>
                        )}
                      </div>
                    </div>

                    <div className="prose prose-blue max-w-none">
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {formData.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {formData.features.filter(f => f.trim()).length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Check className="h-5 w-5 text-blue-500" />
                        Key Features & Benefits
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {formData.features.filter(f => f.trim()).map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 group hover:border-blue-200 hover:from-blue-50/50 hover:to-blue-50/30 transition-all"
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                              <Check className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.div
                  className="bg-gradient-to-br from-blue-50 to-blue-100/20 rounded-xl p-6 border border-blue-200 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Service Overview</h4>
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-blue-700">Category</dt>
                      <dd className="text-sm text-gray-900">{formData.category}</dd>
                    </div>
                    {formData.metadata?.duration && (
                      <div className="flex items-center justify-between">
                        <dt className="text-sm font-medium text-blue-700">Duration</dt>
                        <dd className="text-sm text-gray-900">{formData.metadata.duration}</dd>
                      </div>
                    )}
                    {formData.metadata?.maxCapacity && (
                      <div className="flex items-center justify-between">
                        <dt className="text-sm font-medium text-blue-700">Max Capacity</dt>
                        <dd className="text-sm text-gray-900">{formData.metadata.maxCapacity} people</dd>
                      </div>
                    )}
                    {formData.metadata?.tier && (
                      <div className="flex items-center justify-between">
                        <dt className="text-sm font-medium text-blue-700">Service Tier</dt>
                        <dd className="text-sm text-gray-900">{formData.metadata.tier}</dd>
                      </div>
                    )}
                  </dl>
                </motion.div>

                {formData.metadata?.tags && formData.metadata.tags.length > 0 && (
                  <motion.div
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Tags className="h-4 w-4 text-blue-500" />
                      Service Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 text-sm font-medium border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100/20 rounded-xl p-6 border border-emerald-200/80 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-lg font-semibold text-emerald-900 mb-4">Booking Information</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm text-emerald-800">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Flexible scheduling available</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-emerald-800">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>{formData.metadata?.duration || 'Custom'} duration</span>
                    </li>
                    {formData.metadata?.maxCapacity && (
                      <li className="flex items-center gap-3 text-sm text-emerald-800">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span>Up to {formData.metadata.maxCapacity} people</span>
                      </li>
                    )}
                  </ul>
                </motion.div>

                <Button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const serviceData = {
                        ...formData,
                        features: formData.features.filter(f => f.trim() !== "")
                      };
                      
                      await onSave(serviceData);
                      toast({
                        title: "Success!",
                        description: "Service added to bundle",
                      });
                      onClose();
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to add service to bundle. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || !isFormValid()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-6 text-base font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding to Bundle...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add to Bundle
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-white rounded-3xl border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="p-8 pb-6 flex-shrink-0 bg-white border-b">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              className="space-y-3"
            >
              <DialogTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                {initialData ? 'Edit Custom Service' : 'Create Custom Service'}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-medium shadow-sm">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Flexible Schedule
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 text-sm font-medium shadow-sm">
                  <Check className="h-4 w-4 mr-2 text-emerald-600" />
                  Professional Service
                </span>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTabsVisible(!isTabsVisible)}
                className="rounded-full w-10 h-10 hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
              >
                {isTabsVisible ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full w-10 h-10 hover:bg-gray-100/80 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {isTabsVisible ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-8 border-b border-gray-200 bg-white flex-shrink-0">
                <TabsList className="w-full grid grid-cols-3 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/80">
                  <TabsTrigger
                    value="generate"
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900",
                      "data-[state=inactive]:hover:bg-white/60",
                      "relative overflow-hidden"
                    )}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>AI Generate</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="edit"
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900",
                      "data-[state=inactive]:hover:bg-white/60",
                      "relative overflow-hidden"
                    )}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Service</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900",
                      "data-[state=inactive]:hover:bg-white/60",
                      "relative overflow-hidden"
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="generate" className="m-0 h-full">
                  {activeTab === 'generate' && renderTabContent()}
                </TabsContent>
                <TabsContent value="edit" className="m-0 h-full">
                  {activeTab === 'edit' && renderTabContent()}
                </TabsContent>
                <TabsContent value="preview" className="m-0 h-full">
                  {activeTab === 'preview' && renderTabContent()}
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 