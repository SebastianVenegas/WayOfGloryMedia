'use client'

import { useState, useEffect } from 'react'
import { Package, Loader2, Search, ChevronLeft, ChevronRight, Filter, Plus, ShoppingBag, Minus, X, LayoutGrid, List, CheckCircle2, Mail, Speaker, Network, GraduationCap, Siren, Mic2, Music2, Settings, ArrowRight, WormIcon as WaveformIcon, Check, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductModal from "@/components/ui/product-modal"
import Bundle from "@/components/Bundle"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import Checkout, { CheckoutFormData } from '@/components/Checkout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ServiceModal from "@/components/ui/service-modal"
import CustomServiceModal from "@/components/ui/custom-service-modal"
import ProductForm from '@/components/admin/ProductForm'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { productImages } from '@/lib/product-images'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useSidebar } from '@/contexts/SidebarContext'

// Category type definitions
type MainCategory = 'all' | 'Audio Gear' | 'Streaming Gear' | 'Services';

interface SubCategory {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface CategoryConfig {
  name: string;
  subcategories: SubCategory[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
  'Audio Gear': {
    name: 'Audio Gear',
    subcategories: [
      { name: 'Microphones', path: 'Audio Gear/Mics' },
      { name: 'Mixers', path: 'Audio Gear/Mixers' },
      { name: 'Cables', path: 'Audio Gear/Cables' },
      { name: 'Snakes', path: 'Audio Gear/Snakes' },
      { name: 'Speakers', path: 'Audio Gear/Speakers' },
      { name: 'IEMS', path: 'Audio Gear/IEMS' },
      { name: 'Stands', path: 'Audio Gear/Stands' }
    ]
  },
  'Services': {
    name: 'Services',
    subcategories: [
      { name: 'Custom Services', path: 'Services/Custom' },
      { name: 'Standard Services', path: 'Services' }
    ]
  }
};

type CategoryType = MainCategory | string;

// Filter function for categories
const filterByCategory = (product: Product, selectedCategory: CategoryType): boolean => {
  if (selectedCategory === 'all') return true;
  
  // Main category
  if (selectedCategory === 'Audio Gear') {
    return product.category.startsWith('Audio Gear/');
  }
  
  if (selectedCategory === 'Services') {
    return product.category === 'Services' || product.category === 'Services/Custom';
  }
  
  // Exact subcategory match
  return product.category === selectedCategory;
};

const getProductImageKey = (title: string): string => {
  const titleToKeyMap: Record<string, string> = {
    'PTU-6000-8H 8-Channel UHF Wireless Microphone System': 'ptu-6000-8h',
    'Shure BLX288/PG58 Dual Wireless Microphone System': 'shure-blx288-pg58',
    'VocoPro UHF-8800 Professional 8-Channel Wireless System': 'vocopro-uhf-8800',
    'Drum Microphone Kit - 7-Piece Professional Set': 'drum-mic-kit',
    'Behringer X32 Compact Digital Mixer': 'behringer-x32-compact',
    'Allen & Heath SQ-6 48-channel Digital Mixer': 'allen-heath-sq6',
    'Yamaha MGP32X 32-channel Mixer with Effects': 'yamaha-mgp32x',
    'XLR Cable - 15ft Professional Microphone Cable': 'xlr-15ft',
    'XLR Cable - 20ft Professional Microphone Cable': 'xlr-20ft',
    'XLR Cable - 25ft Professional Microphone Cable': 'xlr-25ft',
    'XLR Cable - 50ft Professional Microphone Cable': 'xlr-50ft',
    'XLR Cable - 100ft Professional Microphone Cable': 'xlr-100ft',
    'Quarter Inch Cable - 15ft Professional Instrument Cable': 'quarter-inch-15ft',
    'Quarter Inch Cable - 20ft Professional Instrument Cable': 'quarter-inch-20ft',
    'Cat6 Cable - 10ft Professional Network Cable': 'cat6-10ft',
    'Cat6 Cable - 50ft Professional Network Cable': 'cat6-50ft',
    'Cat6 Cable - 100ft Professional Network Cable': 'cat6-100ft',
    'AC Power Cable - Professional Grade IEC Power Cord': 'ac-power-cable',
    'QSC K12.2 12" 2000W Powered Speaker': 'qsc-k12-2',
    'RSG15 15" 3000W Passive Speaker System': 'rsg15-speaker-system',
    'JBL EON715 15" & EON718S 18" Powered Speaker System': 'jbl-eon715-system',
    'Mackie THUMP215 15" & THUMP118S 18" Powered System': 'mackie-thump215-system',
    'On Stage SS7761B Pro Speaker Stand': 'ss7761b-speaker-stand',
    'On Stage MS7701B Telescoping Boom Stand': 'ms7701b-mic-stand',
    'Kick Drum Microphone Stand': 'kick-drum-mic-stand',
    'On Stage MS7701B Microphone Boom Stand': 'ms7701b-mic-stand',
    'On Stage SS7761B All-Aluminum Speaker Stand': 'ss7761b-speaker-stand',
    'Allen & Heath DX168 Digital Snake': 'allen-heath-dx168',
    'Midas DL16/DL32 Digital Stage Box': 'midas-dl16-dl32',
    'ProCo StageMASTER 32/4 Analog Snake': 'proco-stagemaster-32-4',
    'Hosa HSS-005X 32-Channel Snake': 'hosa-hss-005x',
    'Behringer S32 Digital Snake': 'behringer-s32',
    'Whirlwind M-32/4 Analog Snake': 'whirlwind-m-32-4',
    'Allen & Heath AB168 Digital Snake': 'allen-heath-ab168',
    'Behringer Powerplay P16-M 16-Channel Digital Personal Mixer': 'behringer-powerplay-p16m',
    'Behringer Powerplay P16-I 16-channel Input Module': 'behringer-powerplay-p16i',
    'Behringer Powerplay P16-D 16-channel Distribution Module': 'behringer-powerplay-p16d',
    'In-Ear Monitors (IEM)': 'iem-headphones'
  };

  return titleToKeyMap[title] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  image_url?: string
  features?: string[]
  included_items?: string[]
  warranty_info?: string
  installation_available?: boolean
  technical_details?: Record<string, string>
  created_at?: string
  updated_at?: string
  images?: { image_url: string }[]
  our_price?: number
  is_service?: boolean
  skip_tax?: boolean
  original_price?: number
  is_custom?: boolean
  quantity?: number
}

interface BundleItem {
  product: Product
  quantity: number
  price: number
  our_price?: number
}

interface CardQuantityState {
  [key: string]: number;
}

interface ProductFormData {
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

interface CustomService {
  title: string
  description: string
  price: number
  features?: string[]
  category: string
  quantity?: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.4
    }
  }
}

const TAX_RATE = 0.0775 // 7.75% for Riverside, CA

const calculateTax = (price: number): number => {
  return price * TAX_RATE
}

const calculateTotalWithTax = (price: number): number => {
  return price * (1 + TAX_RATE)
}

// Calculate bundle totals
const calculateBundleTotals = (items: BundleItem[]) => {
  let subtotal = 0
  let taxableSubtotal = 0

  items.forEach(item => {
    const itemTotal = (item.our_price || item.price) * item.quantity
    subtotal += itemTotal

    // Only add to taxable subtotal if not a service
    if (!item.product.category.startsWith('Services') && !item.product.is_service && !item.product.is_custom) {
      taxableSubtotal += itemTotal
    }
  })

  const tax = taxableSubtotal * TAX_RATE
  const total = subtotal + tax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

const ServiceCard = ({ service, onSelect }: { service: Product, onSelect: (service: Product) => void }) => {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="absolute top-4 right-4 z-10">
        <span className="px-2.5 py-1 bg-blue-50/90 text-blue-600 rounded-full text-xs font-medium border border-blue-100/50 backdrop-blur-sm">
          {service.category}
        </span>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/50 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
            {service.title.includes('Audio System') && <Speaker className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Network') && <Network className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Training') && <GraduationCap className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Emergency') && <Siren className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Studio') && <Mic2 className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Event') && <Music2 className="h-7 w-7 text-blue-600" />}
            {service.title.includes('Acoustics') && <WaveformIcon className="h-7 w-7 text-blue-600" />}
            {!service.title.match(/(Audio System|Network|Training|Emergency|Studio|Event|Acoustics)/) && 
              <Settings className="h-7 w-7 text-blue-600" />
            }
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2.5">
            {service.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {service.features && (
          <div className="mb-6">
            <div className="space-y-2.5">
              {service.features.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
            {service.features.length > 3 && (
              <button 
                onClick={() => onSelect(service)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group/btn"
              >
                View {service.features.length - 3} more features
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <button
            onClick={() => onSelect(service)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 group/btn"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => onSelect(service)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Add type for image URLs
type ImageUrl = string;

// Update the function signatures
const handleImageLoad = (url: ImageUrl) => {
  // ... existing code ...
};

const handleImageError = (url: ImageUrl) => {
  // ... existing code ...
};

export default function ProductsPage() {
  const { isExpanded } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [cardQuantities, setCardQuantities] = useState<CardQuantityState>({})
  const [isListView, setIsListView] = useState(false)
  const [selectedService, setSelectedService] = useState<Product | null>(null)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomServiceModal, setShowCustomServiceModal] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const productsPerPage = 12
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const getAuthToken = () => {
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(c => c.trim().startsWith('auth_token='))
      if (authCookie) {
        const token = authCookie.split('=')[1].trim()
        setAuthToken(token)
      }
    }
    getAuthToken()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        console.log('Product data:', data)
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products
    .sort((a, b) => {
      // First sort by main category
      const categoryOrder = {
        'Audio Gear/Mixers': 1,
        'Audio Gear/Mics': 2,
        'Audio Gear/Stands': 3,
        'Audio Gear/Cables': 4,
        'Audio Gear/Snakes': 5,
        'Audio Gear/Speakers': 6,
        'Audio Gear/IEMS': 7,
        'Streaming Gear': 8,
        'Services': 9
      };
      
      const categoryA = categoryOrder[a.category as keyof typeof categoryOrder] || 10;
      const categoryB = categoryOrder[b.category as keyof typeof categoryOrder] || 10;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      // For cables, sort by type and then by length
      if (a.category === 'Audio Gear/Cables' && b.category === 'Audio Gear/Cables') {
        const cableOrder = {
          'XLR': 1,
          'Quarter Inch': 2,
          'Cat6': 3,
          'AC Power': 4
        };
        
        const getCableType = (title: string) => {
          if (title.includes('XLR')) return 'XLR';
          if (title.includes('Quarter Inch')) return 'Quarter Inch';
          if (title.includes('Cat6')) return 'Cat6';
          if (title.includes('Power')) return 'AC Power';
          return '';
        };
        
        const typeA = cableOrder[getCableType(a.title) as keyof typeof cableOrder] || 5;
        const typeB = cableOrder[getCableType(b.title) as keyof typeof cableOrder] || 5;
        
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        
        // Sort by length (extract numbers from title)
        const getLengthNumber = (title: string) => {
          const match = title.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        
        return getLengthNumber(a.title) - getLengthNumber(b.title);
      }
      
      // For other categories, sort by price
      return (a.price) - (b.price);
    })
    .filter(p => filterByCategory(p, selectedCategory))
    .filter(p => 
      searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Filter out custom services from display
    .filter(p => !(p.category === 'Services' && p.is_custom))

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProductClick = (product: Product) => {
    if (product.category === 'Services') {
      setSelectedService(product);
      setIsServiceModalOpen(true);
    } else {
      const key = getProductImageKey(product.title);
      const images = productImages[key as keyof typeof productImages];
      
      const productWithImages = {
        ...product,
        images: images?.map(url => ({ image_url: url })) || []
      };
      
      setSelectedProduct(productWithImages);
      setIsModalOpen(true);
    }
  };

  const handleCardQuantityChange = (productId: string, amount: number) => {
    setCardQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + amount)
    }))
  }

  const handleAddToBundle = (product: Product) => {
    console.log('addToBundle called with product:', product);
    
    setBundleItems((prev: BundleItem[]) => {
      console.log('Current bundle items:', prev);
      
      // Check if item already exists in bundle
      const existingItem = prev.find(item => item.product.id === product.id);
      console.log('Existing item found:', existingItem);
      
      if (existingItem) {
        // Update quantity if item exists
        const updated = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
        console.log('Updated bundle items:', updated);
        return updated;
      }
      
      // Add new item with specified quantity or default to 1
      const newItem: BundleItem = {
        product: {
          ...product,
          quantity: undefined // Remove quantity from product object
        },
        quantity: product.quantity || 1,
        price: Number(product.price),
        our_price: product.our_price || Number(product.price)
      };
      
      console.log('New bundle item:', newItem);
      const newItems = [...prev, newItem];
      console.log('New bundle items array:', newItems);
      return newItems;
    });
    
    // Show success message
    toast.success(`${product.title} added to bundle`);
    setIsCartOpen(true);  // Open the cart when adding an item
  };

  const removeFromBundle = (productId: string) => {
    setBundleItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const handleBundleQuantityUpdate = (productId: string, newQuantity: number) => {
    setBundleItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const handleCheckout = async (formData: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          products: bundleItems.map(item => ({
            id: Number(item.product.id),
            quantity: item.quantity,
            title: item.product.title,
            price: item.our_price || item.price,
            category: item.product.category
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      toast.success('Order created successfully');
      setBundleItems([]);
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to add product')
      
      const newProduct = await response.json()
      setProducts(prev => [...prev, newProduct])
      setShowForm(false)
      toast.success('Product added successfully')
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  const handleEditProduct = async (formData: ProductFormData) => {
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update product')
      
      const updatedProduct = await response.json()
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      setShowForm(false)
      setSelectedProduct(null)
      toast.success('Product updated successfully')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  const handleCustomServiceSave = async (serviceData: CustomService) => {
    try {
      // First, create the custom service as a product
      const response = await fetch('/api/custom-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: serviceData.title,
          description: serviceData.description,
          price: serviceData.price,
          features: serviceData.features || [],
          category: 'Services'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create custom service');
      }

      if (!data.success || !data.product) {
        throw new Error('Failed to create custom service');
      }

      // Create bundle item from the saved product
      const bundleItem: BundleItem = {
        product: {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          price: data.product.price,
          features: data.product.features,
          category: data.product.category,
          is_custom: true,
          is_service: true
        },
        quantity: 1,
        price: data.product.price,
        our_price: data.product.price
      };

      setBundleItems(prev => [...prev, bundleItem]);
      setShowCustomServiceModal(false);
      setIsCartOpen(true);
      
      toast.success("Custom service created and added to bundle");
    } catch (error) {
      console.error('Error saving custom service:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save custom service");
    }
  }

  // Early return while not mounted to prevent hydration mismatch
  if (!mounted) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Dynamic Header */}
      <div className={cn(
        "sticky top-0 z-[150] bg-white/80 backdrop-blur-md border-b border-gray-200",
        isCheckoutOpen && "bg-white/60 backdrop-blur-lg"
      )}>
        <div className="flex h-20 items-center justify-between gap-4 px-6">
          {/* Left side - Search */}
          <div className="w-full max-w-[320px] relative group">
            <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-500" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 h-12 bg-gray-50/80 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-xl text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Center - Categories */}
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide">
            <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm">
              <AnimatePresence mode="wait">
                {['all', 'Audio Gear', 'Streaming Gear', 'Services'].map((category) => (
                  <motion.div key={category} className="relative">
                    <Button
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "h-8 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 relative whitespace-nowrap",
                        selectedCategory === category 
                          ? "bg-blue-50 text-blue-500" 
                          : "text-gray-600 hover:text-blue-500 hover:bg-blue-50/50"
                      )}
                    >
                      {category === 'all' ? 'All' : category.replace(' Gear', '')}
                    </Button>
                    {selectedCategory === category && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side - View options and Bundle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsListView(!isListView)}
              className="h-12 w-12 text-gray-500 hover:text-gray-900 rounded-xl"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isListView ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isListView ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
              </motion.div>
            </Button>

            {/* Bundle Button */}
            <Button
              variant="default"
              onClick={() => setIsCartOpen(!isCartOpen)}
              className={cn(
                "h-12 px-5 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-3 rounded-xl transition-all duration-200",
                bundleItems.length > 0 && "ring-2 ring-blue-200"
              )}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline text-base">Bundle</span>
              {bundleItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                >
                  {bundleItems.reduce((sum, item) => sum + item.quantity, 0)}
                </motion.div>
              )}
            </Button>
          </div>
        </div>

        {/* Subcategories Bar */}
        {selectedCategory.startsWith('Audio Gear') && (
          <div className="border-t border-gray-200 bg-white/60">
            <div className="px-6">
              <div className="flex items-center -mb-px overflow-x-auto scrollbar-hide py-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory('Audio Gear')}
                  className={cn(
                    "px-3 sm:px-4 h-9 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                    selectedCategory === 'Audio Gear'
                      ? "bg-blue-50 text-blue-500"
                      : "text-gray-600 hover:text-blue-500 hover:bg-blue-50/50"
                  )}
                >
                  All Audio
                </Button>
                {CATEGORIES['Audio Gear'].subcategories.map((subcat) => (
                  <Button
                    key={subcat.path}
                    variant="ghost"
                    onClick={() => setSelectedCategory(subcat.path)}
                    className={cn(
                      "px-3 sm:px-4 h-9 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ml-2",
                      selectedCategory === subcat.path 
                        ? "bg-blue-50 text-blue-500" 
                        : "text-gray-600 hover:text-blue-500 hover:bg-blue-50/50"
                    )}
                  >
                    {subcat.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content with Cart */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        {/* Products Grid */}
        <motion.div 
          data-main-content
          layout
          className={cn(
            "flex-1 p-6 transition-all duration-300",
            isCartOpen ? "lg:mr-[350px]" : ""
          )}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            layout
            className={cn(
              "grid gap-4 transition-all duration-300",
              isListView 
                ? 'grid-cols-1' 
                : isCartOpen
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            )}
          >
            {currentProducts.map((product) => (
              product.category === 'Services' ? (
                <ServiceCard
                  key={product.id}
                  service={product}
                  onSelect={handleProductClick}
                />
              ) : (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className={cn(
                    "group relative bg-white rounded-lg border border-gray-200 hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 flex flex-col",
                    isListView ? "flex-row gap-4 p-4" : ""
                  )}
                >
                  <div 
                    className={cn(
                      "relative bg-white overflow-hidden cursor-pointer rounded-lg",
                      isListView ? "h-24 w-24 flex-shrink-0" : "aspect-square w-full"
                    )}
                    onClick={() => handleProductClick(product)}
                  >
                    {(() => {
                      const key = getProductImageKey(product.title);
                      const images = productImages[key as keyof typeof productImages];
                      if (images && images.length > 0) {
                        return (
                          <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Image
                              src={images[0]}
                              alt={product.title}
                              fill
                              className="object-contain p-2"
                              sizes="80px"
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      );
                    })()}
                  </div>

                  <div className={cn(
                    isListView ? "flex-1 py-1" : "p-4"
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 
                        className={cn(
                          "font-medium text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer",
                          isListView ? "text-sm line-clamp-1" : "text-base line-clamp-2"
                        )}
                        onClick={() => handleProductClick(product)}
                      >
                        {product.title}
                      </h3>
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "font-semibold text-blue-600 whitespace-nowrap",
                          isListView ? "text-sm" : "text-base"
                        )}>
                          ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    {!isListView && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {!isListView && product.features && product.features.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Key Features</h4>
                        <ul className="space-y-1.5">
                          {product.features.slice(0, 2).map((feature, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-center">
                              <span className="w-1 h-1 rounded-full bg-blue-600/80 mr-1.5 flex-shrink-0" />
                              <span className="line-clamp-1">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {product.features.length > 2 && (
                          <button 
                            onClick={() => handleProductClick(product)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1 group/btn"
                          >
                            +{product.features.length - 2} more features
                            <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className={cn(
                      isListView 
                        ? "flex items-center justify-between mt-2" 
                        : "mt-3 pt-3 border-t border-gray-100"
                    )}>
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-100 shrink-0">
                          {product.category.split('/')[1] || product.category}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQuantity = Math.max(1, (cardQuantities[product.id] || 1) - 1);
                                setCardQuantities(prev => ({
                                  ...prev,
                                  [product.id]: newQuantity
                                }));
                              }}
                              disabled={!cardQuantities[product.id] || cardQuantities[product.id] <= 1}
                              className="h-6 w-6 shrink-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {cardQuantities[product.id] || 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQuantity = (cardQuantities[product.id] || 1) + 1;
                                setCardQuantities(prev => ({
                                  ...prev,
                                  [product.id]: newQuantity
                                }));
                              }}
                              className="h-6 w-6 shrink-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToBundle({
                                ...product,
                                quantity: cardQuantities[product.id] || 1
                              });
                            }}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium h-8 px-3 shrink-0"
                          >
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <span>Add</span>
                              <Plus className="h-3 w-3" />
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex justify-center mt-8 pb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 sm:h-9 sm:w-9 transition-all hover:scale-105 hover:border-blue-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 transition-all text-sm",
                    currentPage === page 
                      ? "bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 text-white" 
                      : "hover:border-blue-300 hover:scale-105 text-gray-600"
                  )}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 sm:h-9 sm:w-9 transition-all hover:scale-105 hover:border-blue-400"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bundle Section */}
        <AnimatePresence mode="wait">
          {isCartOpen && (
            <motion.div
              initial={{ 
                opacity: 0,
                x: "100%"
              }}
              animate={{ 
                opacity: 1,
                x: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }
              }}
              exit={{ 
                opacity: 0,
                x: "100%",
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }
              }}
              className={cn(
                "fixed inset-y-0 right-0 w-[350px] bg-white border-l border-gray-100 shadow-lg",
                "pt-20 z-[45]"
              )}
            >
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="absolute top-4 right-4 lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Drag Handle - Only show on larger screens */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/20 transition-colors z-50 hidden lg:block"
                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                  const handle = e.currentTarget;
                  const cart = handle.parentElement as HTMLDivElement;
                  const mainContent = document.querySelector('[data-main-content]') as HTMLDivElement;
                  const startX = e.clientX;
                  const startWidth = cart.offsetWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = Math.min(Math.max(280, startWidth + (startX - e.clientX)), 500);
                    cart.style.width = `${newWidth}px`;
                    if (mainContent) {
                      mainContent.style.marginRight = `${newWidth}px`;
                    }
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = 'default';
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                  document.body.style.cursor = 'ew-resize';
                }}
              />
              <div className="h-full">
                <Bundle 
                  products={bundleItems.map(item => ({
                    ...item.product,
                    id: Number(item.product.id),
                    quantity: item.quantity,
                    price: item.our_price || item.price
                  }))}
                  onRemove={removeFromBundle}
                  onUpdateQuantity={handleBundleQuantityUpdate}
                  isOpen={isCartOpen}
                  setIsOpen={setIsCartOpen}
                  clearCart={() => setBundleItems([])}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checkout Component */}
      {isCheckoutOpen && (
        <Checkout
          products={bundleItems.map(item => ({
            id: Number(item.product.id),
            title: item.product.title,
            price: item.our_price || item.price,
            quantity: item.quantity,
            category: item.product.category
          }))}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleCheckout}
          clearCart={() => setBundleItems([])}
        />
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          onAddToBundle={(product) => handleAddToBundle(product)}
          selectedProduct={selectedProduct}
        />
      )}

      {/* Service Modal */}
      {selectedService && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => {
            setIsServiceModalOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onAddToBundle={(service) => handleAddToBundle(service)}
          setIsCartOpen={setIsCartOpen}
        />
      )}

      {/* Add Product Form */}
      {showForm && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <ProductForm
            onSubmit={handleAddProduct}
          />
          <Button
            onClick={() => setShowForm(false)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Edit Product Form */}
      {selectedProduct && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
          <ProductForm
            onSubmit={handleEditProduct}
            initialData={{
              title: selectedProduct.title,
              description: selectedProduct.description,
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
          <Button
            onClick={() => setSelectedProduct(null)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Custom Service Modal */}
      <CustomServiceModal
        isOpen={showCustomServiceModal}
        onClose={() => setShowCustomServiceModal(false)}
        onSave={handleCustomServiceSave}
      />
    </div>
  )
} 