import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wrench, X, Sparkles, Plus, Save, Clock, Check, DollarSign, Loader2, AlertCircle, Wand2, Eye, Edit, ArrowRight, Target, Zap, Users, Calendar, Tags, Lightbulb, Settings, PenTool, Palette, BarChart, Video, Radio, Scissors, Globe, Smartphone, Mic2, Code2, Headphones, GitMerge, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ServiceCategory = 
  | "Audio" 
  | "Video" 
  | "Lighting" 
  | "Equipment" 
  | "Software" 
  | "Web Development" 
  | "Mobile Apps" 
  | "Consulting" 
  | "Training" 
  | "Support" 
  | "Other"

type ServiceTier = "Basic" | "Standard" | "Premium" | "Custom"
type ServiceDuration = "Hourly" | "Daily" | "Weekly" | "Monthly" | "Project-based"

interface ServiceMetadata {
  targetAudience?: string
  estimatedDuration?: string
  tier?: ServiceTier
  category?: ServiceCategory
  duration?: ServiceDuration
  maxCapacity?: number
  availability?: string[]
  tags?: string[]
  isClientSpecific?: boolean
  clientName?: string | null
}

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
  metadata?: ServiceMetadata
}

export type { CustomService }

interface CustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: CustomService) => void
  initialData?: CustomService
  showTabs?: boolean
}

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

export default function CustomServiceModal({ isOpen, onClose, onSave, initialData, showTabs = true }: CustomServiceModalProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [isImproving, setIsImproving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isTabsVisible, setIsTabsVisible] = useState(showTabs)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CustomService>(initialData || {
    title: "",
    description: "",
    price: 0,
    features: [""],
    category: "Services",
    is_custom: true
  })

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [generationStyle, setGenerationStyle] = useState<'creative' | 'professional' | 'technical'>('professional')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const serviceTemplates = [
    // Audio Services
    {
      id: 'audio-setup',
      title: 'Audio Setup & Installation',
      description: 'Professional audio equipment setup and configuration service',
      icon: Sparkles,
      category: 'Audio'
    },
    {
      id: 'live-sound',
      title: 'Live Sound Engineering',
      description: 'Expert live sound mixing and management',
      icon: Zap,
      category: 'Audio'
    },
    {
      id: 'audio-consulting',
      title: 'Audio Consulting',
      description: 'Professional advice on audio systems and acoustics',
      icon: Lightbulb,
      category: 'Audio'
    },
    // Video Services
    {
      id: 'video-production',
      title: 'Video Production',
      description: 'Professional video shooting and editing services',
      icon: Video,
      category: 'Video'
    },
    {
      id: 'live-streaming',
      title: 'Live Streaming',
      description: 'Professional live streaming setup and management',
      icon: Radio,
      category: 'Video'
    },
    {
      id: 'video-editing',
      title: 'Video Editing',
      description: 'Professional video post-production and editing',
      icon: Scissors,
      category: 'Video'
    },
    // Software Services
    {
      id: 'web-development',
      title: 'Web Development',
      description: 'Custom website and web application development',
      icon: Globe,
      category: 'Software'
    },
    {
      id: 'mobile-app',
      title: 'Mobile App Development',
      description: 'Custom iOS and Android application development',
      icon: Smartphone,
      category: 'Software'
    },
    {
      id: 'software-integration',
      title: 'Software Integration',
      description: 'Seamless integration of various software systems',
      icon: GitMerge,
      category: 'Software'
    }
  ]

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
        category: "Services",
        is_custom: true
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
      
      // Modify the prompt to be more specific if it's for a client
      const processedPrompt = isClientSpecific
        ? aiPrompt.replace(/^for\s+([^,\.]+)/i, `Create a customized service specifically for ${clientName},`)
        : aiPrompt;

      const response = await fetch('/api/admin/generate-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: processedPrompt,
          template: selectedTemplate,
          style: generationStyle,
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
                  ? "personalized and tailored" 
                  : "innovative and engaging",
                focus: isClientSpecific 
                  ? `specific needs and requirements of ${clientName}` 
                  : "unique value propositions and creative solutions"
              },
              professional: {
                tone: isClientSpecific 
                  ? "client-focused and customized" 
                  : "formal and business-oriented",
                focus: isClientSpecific 
                  ? `specialized solutions for ${clientName}` 
                  : "expertise and industry standards"
              },
              technical: {
                tone: isClientSpecific 
                  ? "precise and client-specific" 
                  : "detailed and precise",
                focus: isClientSpecific 
                  ? `technical requirements specific to ${clientName}` 
                  : "technical specifications and capabilities"
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
          category: "Services",
          is_custom: true
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
        category: "Services",
        is_custom: true
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate':
  return (
          <div className="p-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-8">
                <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                  <h3 className="text-xl font-semibold text-blue-950 mb-4">AI Service Generation</h3>
                  <p className="text-blue-700 mb-6 text-base">
                    Let our AI help you create professional service descriptions. Choose a template or start from scratch.
                  </p>
                  
                  {/* Category Tabs */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-4">
                      {['All', 'Audio', 'Video', 'Software', 'Consulting'].map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            selectedCategory === category
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                          )}
                        >
                          {category}
                        </button>
                      ))}
          </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {serviceTemplates
                      .filter(template => 
                        selectedCategory === 'All' || 
                        template.category === selectedCategory
                      )
                      .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                            "flex flex-col items-center p-6 rounded-xl border transition-all",
                            "hover:border-blue-300 hover:bg-white/80 hover:shadow-md",
                            selectedTemplate === template.id
                              ? "border-blue-500 bg-white shadow-md"
                              : "border-blue-200 bg-white/60"
                          )}
                        >
                          <template.icon className="h-10 w-10 text-blue-600 mb-3" />
                          <h4 className="text-sm font-medium text-gray-900">{template.title}</h4>
                          <p className="text-xs text-gray-500 text-center mt-2">{template.description}</p>
                          <span className="mt-3 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {template.category}
                          </span>
                        </button>
                      ))}
                  </div>
          </div>

                <div className="space-y-6">
                <Textarea
                    placeholder="Describe your service in detail..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[200px] resize-none bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300 rounded-xl text-base shadow-sm"
                  />
                  
                  <div className="flex items-center justify-between bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">Style:</span>
                      {['creative', 'professional', 'technical'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setGenerationStyle(style as any)}
                          className={cn(
                            "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                            generationStyle === style
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                          )}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className={cn(
                        "text-gray-700 border-gray-200",
                        showAdvancedOptions && "bg-gray-100 border-gray-300"
                      )}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Options
                    </Button>
                  </div>

                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Target Audience</label>
                        <Input
                          value={formData.metadata?.targetAudience || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, targetAudience: e.target.value }
                          })}
                          placeholder="e.g., Professional musicians"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Tier</label>
                        <select
                          value={formData.metadata?.tier || 'Standard'}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, tier: e.target.value as ServiceTier }
                          })}
                          className="w-full rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500"
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
                          className="w-full rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          {['Hourly', 'Daily', 'Weekly', 'Monthly', 'Project-based'].map((duration) => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Max Capacity</label>
                        <Input
                          type="number"
                          value={formData.metadata?.maxCapacity || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            metadata: { ...formData.metadata, maxCapacity: parseInt(e.target.value) }
                          })}
                          placeholder="e.g., 50"
                          className="bg-white"
                        />
                      </div>
                    </motion.div>
                  )}

                <Button
                  onClick={handleGenerateService}
                  disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-7 text-base font-medium"
                >
                  {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Generating Your Service...
                      </>
                  ) : (
                    <>
                        <Wand2 className="h-5 w-5 mr-3" />
                        Generate Professional Service
                    </>
                  )}
                </Button>
              </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Quick Start</h3>
                      <p className="text-sm text-gray-500">AI-powered service templates</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { 
                        prompt: "Create a professional audio recording service with studio quality equipment and post-production",
                        icon: Mic2,
                        color: "blue" as const
                      },
                      { 
                        prompt: "Create a professional video production service with 4K recording and editing",
                        icon: Video,
                        color: "purple" as const
                      },
                      { 
                        prompt: "Create a professional web development service with modern design and SEO optimization",
                        icon: Code2,
                        color: "emerald" as const
                      }
                    ].map((template, index) => {
                      const colors = {
                        blue: "bg-blue-50/50 border-blue-200 hover:border-blue-300 hover:bg-blue-50",
                        purple: "bg-purple-50/50 border-purple-200 hover:border-purple-300 hover:bg-purple-50",
                        emerald: "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                      };
                      
                      return (
                        <motion.button
                          key={index}
                          onClick={async () => {
                            setIsGenerating(true);
                            try {
                              const response = await fetch('/api/admin/generate-service', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  prompt: template.prompt,
                                  style: 'professional',
                                  metadata: {
                                    targetAudience: "Professional clients",
                                    tier: "Premium" as ServiceTier
                                  }
                                })
                              });

                              if (!response.ok) throw new Error('Failed to generate service');

                              const generated = await response.json();
                              setFormData({
                                ...formData,
                                title: generated.title || '',
                                description: generated.description || '',
                                features: generated.features || [''],
                                price: generated.price || 0,
                                metadata: {
                                  ...formData.metadata,
                                  ...generated.metadata
                                }
                              });
                              setActiveTab('edit');
                            } catch (error) {
                              toast({
                                title: "Generation Failed",
                                description: "Failed to generate service. Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          disabled={isGenerating}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all duration-200",
                            "hover:shadow-sm group relative",
                            isGenerating && "opacity-50 cursor-not-allowed",
                            colors[template.color]
                          )}
                        >
                          {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                              <template.icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">
                                Generate {template.prompt.split("Create a ")[1].split(" with")[0]}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                AI will generate a complete service based on industry standards
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Need something specific?</span>
                      <Button
                        onClick={() => setActiveTab('generate')}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3"
                      >
                        <Wand2 className="h-3 w-3 mr-1.5" />
                        Use AI Generator
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl p-6 border border-blue-200 shadow-sm">
                  <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                    Template Benefits
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Instant professional service setup",
                      "Industry-standard pricing",
                      "Proven feature sets",
                      "Customizable templates",
                      "Ready-to-use structure",
                      "Time-saving solutions"
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2.5 text-sm text-blue-700 group">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Check className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 'edit':
        return (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Service Title
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Premium Audio Setup"
                      className="h-9 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Price (USD)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
                      <Input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="h-9 pl-8 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your service in detail..."
                    className="h-24 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none hover:border-blue-200"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Features
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <p className="text-xs text-gray-500">Add up to 10 key features</p>
                    </div>
                    <Button
                      type="button"
                      onClick={addFeature}
                      variant="outline"
                      size="sm"
                      disabled={formData.features.length >= 10}
                      className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Feature
                    </Button>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <motion.div layout className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        layout
                          initial={slideIn.initial}
                          animate={slideIn.animate}
                          exit={slideIn.exit}
                        className="flex gap-2"
                      >
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                            className="h-9 flex-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-200"
                        />
                        <Button
                          type="button"
                          onClick={() => removeFeature(index)}
                          variant="ghost"
                          size="icon"
                            className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                  </AnimatePresence>
                </div>
                </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Service Details</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="h-9 w-full rounded-md border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {['Audio', 'Video', 'Lighting', 'Equipment', 'Setup', 'Consulting', 'Other'].map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Duration</label>
                      <select
                        value={formData.metadata?.duration || 'Hourly'}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, duration: e.target.value as ServiceDuration }
                        })}
                        className="h-9 w-full rounded-md border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {['Hourly', 'Daily', 'Weekly', 'Monthly', 'Project-based'].map((duration) => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Target Audience</label>
                      <Input
                        value={formData.metadata?.targetAudience || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, targetAudience: e.target.value }
                        })}
                        placeholder="e.g., Professional musicians"
                        className="h-9 bg-white text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Maximum Capacity</label>
                      <Input
                        type="number"
                        value={formData.metadata?.maxCapacity || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, maxCapacity: parseInt(e.target.value) }
                        })}
                        placeholder="e.g., 50"
                        className="h-9 bg-white text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <Input
                        value={formData.metadata?.tags?.join(', ') || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, tags: e.target.value.split(',').map(t => t.trim()) }
                        })}
                        placeholder="e.g., audio, live, professional"
                        className="h-9 bg-white text-sm"
                      />
                      <p className="text-xs text-gray-500">Separate with commas</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleImproveService}
                    variant="outline"
                      size="sm"
                    disabled={isImproving}
                      className="h-8 bg-white text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
                  >
                    {isImproving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Improving...
                        </>
                    ) : (
                      <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Improve with AI
                      </>
                    )}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving || !hasChanges}
                      className={cn(
                        "h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
                        (!hasChanges || isSaving) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5" />
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
          <div className="p-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                <motion.div 
                  className="bg-white rounded-2xl p-8 space-y-8 border border-gray-200 shadow-sm"
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  exit={fadeIn.exit}
                >
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold text-gray-900">
                          {formData.title || 'Untitled Service'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
                            {formData.category || 'Custom Service'}
                          </span>
                          {formData.metadata?.tier && (
                            <span className="px-3 py-1 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-full">
                              {formData.metadata.tier} Tier
                            </span>
                          )}
                          {formData.metadata?.duration && (
                            <span className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-50 rounded-full">
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
                            className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 group hover:border-blue-200 hover:from-blue-50/50 hover:to-blue-50/30 transition-colors"
                          >
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
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
                  className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 border border-blue-100 shadow-sm"
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
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Tags className="h-5 w-5 text-blue-500" />
                      Service Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                    </span>
                      ))}
                  </div>
                  </motion.div>
                )}

                <motion.div
                  className="bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-2xl p-6 border border-emerald-100 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-lg font-semibold text-emerald-900 mb-4">Booking Information</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-emerald-800">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      Flexible scheduling available
                    </li>
                    <li className="flex items-center gap-3 text-sm text-emerald-800">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      {formData.metadata?.duration || 'Custom'} duration
                    </li>
                    {formData.metadata?.maxCapacity && (
                      <li className="flex items-center gap-3 text-sm text-emerald-800">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Up to {formData.metadata.maxCapacity} people
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
                <TabsList className="w-full grid grid-cols-3 bg-gray-100/80 p-1.5 rounded-2xl">
                  <TabsTrigger
                    value="generate"
                    className={cn(
                      "flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all rounded-xl",
                      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600",
                      "data-[state=active]:text-white data-[state=active]:shadow-md",
                      "hover:bg-white/90"
                    )}
                  >
                    <Wand2 className="h-4 w-4" />
                    AI Generate
                  </TabsTrigger>
                  <TabsTrigger
                    value="edit"
                    className={cn(
                      "flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all rounded-xl",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md",
                      "hover:bg-white/90"
                    )}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className={cn(
                      "flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all rounded-xl",
                      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md",
                      "hover:bg-white/90"
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
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