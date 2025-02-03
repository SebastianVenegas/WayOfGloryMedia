import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-custom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Package, FileText, X, ArrowRight, DollarSign, Wand2, Edit, Eye, Plus, Mic, MicOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  item(index: number): {
    transcript: string;
  };
}

interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): SpeechRecognitionResult;
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

interface CustomServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: CustomService) => void
}

interface CustomService {
  title: string
  description: string
  price: number
  features: string[]
  category: string
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

const slideIn = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 }
}

const pulseAnimation = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const waveAnimation = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function CustomServiceModal({ isOpen, onClose, onSave }: CustomServiceModalProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CustomService>({
    title: "",
    description: "",
    price: 0,
    features: [""],
    category: "Services"
  })

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // Configure for continuous speech recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        console.log('Speech recognition started')
        setIsRecording(true)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results.item(i)
          const transcript = result.item(0).transcript
          
          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        setAiPrompt(prev => {
          const newText = (prev + ' ' + finalTranscript).trim()
          return interimTranscript ? newText + ' ' + interimTranscript : newText
        })
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        toast({
          title: "Voice Input Error",
          description: event.error === 'not-allowed' 
            ? "Please allow microphone access to use voice input."
            : "There was an error with voice input. Please try again.",
          variant: "destructive",
        })
      }

      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsRecording(false)
      }

      setRecognition(recognition)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [toast])

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      recognition.stop()
    } else {
      setAiPrompt('')  // Clear existing text when starting new recording
      recognition.start()
      toast({
        title: "Recording Started",
        description: "Speak clearly to describe the service you want to create.",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      })
      return
    }
    onSave({
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
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
      const response = await fetch('/api/enhance-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          features: formData.features.filter(f => f.trim())
        })
      })

      if (!response.ok) throw new Error('Failed to enhance service')

      const enhanced = await response.json()
      setFormData(prev => ({
        ...prev,
        title: enhanced.title || prev.title,
        description: enhanced.description || prev.description,
        features: enhanced.features || prev.features
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
      const response = await fetch('/api/generate-service', {
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
        category: 'Services'
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
      <DialogContent className="max-w-lg p-0 gap-0 bg-white rounded-2xl border-none shadow-2xl">
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
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
              <Package className="h-4 w-4 mr-2" />
              Create Custom Service
            </span>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              New Custom Service
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
                <motion.div
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <TabsTrigger 
                    value={tab.id} 
                    className={cn(
                      "gap-2 w-full transition-all duration-200",
                      activeTab === tab.id ? "bg-white shadow-lg text-blue-600" : "hover:bg-white/50"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideIn}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="ai" className="mt-0 space-y-6">
                  {/* Voice Input Section */}
                  <div className="relative">
                    <motion.div 
                      className={cn(
                        "absolute inset-0 rounded-2xl",
                        isRecording ? "bg-gradient-to-br from-red-50 to-red-100" : "bg-gradient-to-br from-blue-50 to-blue-100"
                      )}
                      animate={isRecording ? pulseAnimation : {}}
                    />
                    
                    {/* Audio Wave Animation */}
                    {isRecording && (
                      <div className="absolute inset-x-0 bottom-0 h-16 flex items-end justify-center gap-1 pb-4">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-red-400/50 rounded-full"
                            style={{ height: Math.random() * 100 + '%' }}
                            animate={waveAnimation}
                            transition={{ delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="relative p-8 flex flex-col items-center text-center space-y-4">
                      <motion.button
                        onClick={toggleRecording}
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200",
                          "shadow-lg hover:shadow-xl",
                          isRecording 
                            ? "bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isRecording ? (
                          <MicOff className="h-8 w-8" />
                        ) : (
                          <Mic className="h-8 w-8" />
                        )}
                      </motion.button>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {isRecording ? "Listening..." : "Start Speaking"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {isRecording 
                            ? "Click the microphone when you're done speaking" 
                            : "Click the microphone and describe your service"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Service Description
                      </label>
                      {aiPrompt.trim() && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAiPrompt('')}
                          className="h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Text
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Your service description will appear here as you speak, or type it manually..."
                        className={cn(
                          "min-h-[120px] rounded-xl transition-all duration-300",
                          "border-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-none",
                          "placeholder:text-gray-400",
                          isRecording && "border-red-200 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {isRecording && (
                        <div className="absolute right-3 top-3">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateService}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className={cn(
                      "w-full h-14 rounded-xl flex items-center justify-center gap-3 transition-all duration-300",
                      "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600",
                      "text-white font-medium",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                        <span className="text-base">Creating Your Service...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
                        <span className="text-base">Generate Custom Service</span>
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="edit" className="mt-0 space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Service Title
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter service title"
                        className="h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the service..."
                        className="min-h-[100px] rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        required
                      />
                    </div>

                    {/* Price Input */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                        Price
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="pl-12 h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                          min={0}
                          step="0.01"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500">$</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          Features
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addFeature}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Feature
                        </Button>
                      </label>
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              placeholder={`Feature ${index + 1}`}
                              className="h-11 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {formData.features.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFeature(index)}
                                className="h-11 w-11 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={handleImproveService}
                        disabled={isImproving}
                        className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                      >
                        {isImproving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Improving...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4" />
                            Improve with AI
                          </>
                        )}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                      >
                        Create Service
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {formData.title || "Service Title"}
                          </h3>
                          <div className="mt-2 text-lg font-semibold text-blue-600">
                            ${formData.price.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {formData.description || "Service description will appear here..."}
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Features:</h4>
                          <ul className="space-y-2">
                            {formData.features.filter(f => f.trim()).map((feature, index) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-2 text-gray-600"
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                {feature}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 