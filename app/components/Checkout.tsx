import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: number
  title: string
  quantity: number
  price: number
  our_price?: number
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingInstructions: string
  installationAddress: string
  installationCity: string
  installationState: string
  installationZip: string
  installationDate: string
  installationTime: string
  accessInstructions: string
  contactOnsite: string
  contactOnsitePhone: string
  paymentMethod: string
}

interface CheckoutProps {
  products: Product[]
  onClose: () => void
  onSubmit: () => void
  installationPrice: number
}

export default function Checkout({ products, onClose, onSubmit, installationPrice }: CheckoutProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingInstructions: '',
    installationAddress: '',
    installationCity: '',
    installationState: '',
    installationZip: '',
    installationDate: '',
    installationTime: '',
    accessInstructions: '',
    contactOnsite: '',
    contactOnsitePhone: '',
    paymentMethod: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: products.map(product => ({
            id: product.id,
            quantity: product.quantity,
            title: product.title
          })),
          customer: formData,
          installationPrice
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSubmit()
      } else {
        throw new Error(data.error || 'Failed to create contract')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Form fields here */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              {/* Add other form fields similarly */}
            </div>

            <div className="pt-4 border-t">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Contract...
                  </span>
                ) : (
                  'Complete Contract'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Creating your contract...</p>
          </motion.div>
        </motion.div>
      )}
    </>
  )
} 