'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ClipboardX,
  Trash2,
  Mail,
  ChevronUp,
  ChevronDown,
  Info,
  Truck,
  MapPin,
  Phone,
  Building2,
  Package,
  Plus,
  FileText,
  DollarSign,
  Wrench,
  CreditCard,
  PenTool,
  X,
  Eye,
  RefreshCw,
  PackageSearch,
  User,
  Clock, 
  CheckCircle2, 
  XCircle,
  Settings,
  Code,
  Sparkles,
  ChevronRight,
  Shield,
  Calendar,
  Loader2,
  Wand2,
  Minimize2,
  Maximize2,
  Receipt,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from '@/components/admin/EmailComposer'
import { type DialogProps } from "@radix-ui/react-dialog"
import { FC } from "react"
import EmailPreview from '@/components/email-preview'
import { Textarea } from "@/components/ui/textarea"
import PaymentManager from '@/components/admin/PaymentManager'

const Editor = dynamic(() => import('@/components/ui/editor'), { ssr: false })

interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price_at_time: number | string
  cost_at_time: number | string
  product?: {
    title: string
    category?: string
    is_service?: boolean
    id?: number
    description?: string
    features?: string[]
    technical_details?: Record<string, string>
    included_items?: string[]
    warranty_info?: string
    installation_available?: boolean
  }
}

interface Order {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  organization: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_instructions: string
  installation_address: string
  installation_city: string
  installation_state: string
  installation_zip: string
  installation_date: string
  installation_time: string
  access_instructions: string
  contact_onsite: string
  contact_onsite_phone: string
  payment_method: string
  total_amount: number | string
  total_cost: number | string
  total_profit: number | string
  installation_price: number | string
  signature_url: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed'
  created_at: string
  order_items: OrderItem[]
  contract_number: string
  order_creator: string
  payment_status: 'pending' | 'partial' | 'completed';
  // New installment payment fields
  paymentPlan: 'full' | 'installments';
  dueToday?: number;
  totalDueAfterFirst?: number;
  paymentFrequency?: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
}

const TAX_RATE = 0.0775 // 7.75% for Riverside, CA

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00'
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2)
}

const calculateTax = (amount: number | string): number => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numericAmount * TAX_RATE
}

const calculateTotalWithTax = (amount: number | string): number => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numericAmount * (1 + TAX_RATE)
}

// Update the isServiceItem helper function to check for services
const isServiceItem = (item: OrderItem): boolean => {
  // Check if the product exists and has category or is_service flag
  if (!item.product) return false;
  
  return (
    item.product.category === 'Services' || 
    item.product.category === 'Services/Custom' || 
    item.product.is_service === true
  );
};

const calculateOrderTax = (order: Order): number => {
  const taxableAmount = order.order_items.reduce((sum, item) => {
    // Skip tax for services
    if (isServiceItem(item)) {
      return sum;
    }
    return sum + (Number(item.price_at_time) * item.quantity);
  }, 0);
  
  return taxableAmount * 0.0775; // 7.75% tax rate
};

const calculateOrderRevenue = (order: Order) => {
  const revenue = {
    products: 0,
    services: 0,
    installation: Number(order.installation_price || 0)
  };

  order.order_items.forEach(item => {
    const price = Number(item.price_at_time) * item.quantity;
    if (isServiceItem(item)) {
      revenue.services += price;
    } else {
      revenue.products += price;
    }
  });

  return revenue;
};

const calculateOrderProfit = (order: Order) => {
  const profit = {
    products: 0,
    services: 0,
    installation: Number(order.installation_price || 0)  // 100% profit
  };

  console.log('Calculating profit for order:', order.id);
  
  order.order_items.forEach(item => {
    const price = Number(item.price_at_time) * item.quantity;
    console.log('Item:', {
      id: item.id,
      product: item.product,
      price,
      isService: isServiceItem(item)
    });
    
    if (isServiceItem(item)) {
      profit.services += price;  // 100% profit for services
      console.log('Added to services profit:', price);
    } else {
      profit.products += price * 0.20;  // 20% profit for products
      console.log('Added to products profit:', price * 0.20);
    }
  });

  console.log('Final profit calculation:', profit);
  return profit;
};

const calculateOrderTotalWithTax = (order: Order): number => {
  const { taxableSubtotal, nonTaxableSubtotal } = order.order_items.reduce(
    (acc, item) => {
      const itemTotal = Number(item.price_at_time) * item.quantity;
      if (isServiceItem(item)) {
        return {
          ...acc,
          nonTaxableSubtotal: acc.nonTaxableSubtotal + itemTotal
        };
      }
      return {
        ...acc,
        taxableSubtotal: acc.taxableSubtotal + itemTotal
      };
    },
    { taxableSubtotal: 0, nonTaxableSubtotal: 0 }
  );

  const tax = taxableSubtotal * 0.0775;
  return taxableSubtotal + nonTaxableSubtotal + tax + Number(order.installation_price || 0);
};

const handleResendEmail = async (orderId: number) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/resend-email`, {
      method: 'POST'
    });

    if (response.ok) {
      showToast(`Order confirmation email has been resent for order #${orderId}`);
    } else {
      throw new Error('Failed to resend email');
    }
  } catch (error) {
    console.error('Error resending email:', error);
    showToast("Failed to resend email. Please try again.", 'error');
  }
};

const handleDeleteOrder = async (orderId: number, orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>>) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      setOrders(orders.filter((order: Order) => order.id !== orderId));
      showToast(`Order #${orderId} has been deleted successfully`);
    } else {
      throw new Error('Failed to delete order');
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    showToast("Failed to delete order. Please try again.", 'error');
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'default'
    case 'confirmed':
      return 'secondary'
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    case 'delayed':
      return 'secondary'
    default:
      return 'default'
  }
}

// Update type definitions
type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed' | 'all';
type OrderStatusUpdate = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

// Add this near the top with other type definitions
type EmailTabValue = 'content' | 'variables' | 'history';

// Add this before the component
function formatEmailPreview({ subject, content, order }: { 
  subject: string
  content: string
  order: any
}): string {
  // Check if content is already HTML
  // Ensure proper content formatting
  const formattedContent = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => line.startsWith('<p>') ? line : `<p style="margin: 0 0 16px 0; line-height: 1.6;">${line}</p>`)
    .join('\n')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            -webkit-font-smoothing: antialiased;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          }
          .wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 40px 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 32px 40px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .logo {
            width: 180px;
            height: auto;
            margin-bottom: 24px;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .content-wrapper {
            padding: 40px;
            background-color: #ffffff;
          }
          .content {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 16px 0;
          }
          .order-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          .order-details h3 {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 16px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .order-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .order-detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-size: 14px;
          }
          .detail-value {
            color: #0f172a;
            font-size: 14px;
            font-weight: 500;
          }
          .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
          .signature-name {
            color: #1e293b;
            font-weight: 600;
            margin: 0 0 4px 0;
          }
          .signature-title {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 16px 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 32px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          .footer-logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
            opacity: 0.9;
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 8px 0;
            line-height: 1.5;
          }
          .footer-links {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          .footer-links a {
            color: #2563eb;
            text-decoration: none;
            font-size: 14px;
            margin: 0 12px;
          }
          .social-links {
            margin-top: 20px;
          }
          .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #64748b;
            text-decoration: none;
          }
          .highlight {
            color: #2563eb;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="email-container">
            <div class="header">
              <img src="https://wayofglory.com/images/logo/logo.png" alt="Way of Glory Media" class="logo" />https://wayofglory.com/images/logo/logo.png
              <h1>${subject}</h1>
            </div>
            
            <div class="content-wrapper">
              <div class="content">
                ${formattedContent}
              </div>

              <div class="order-details">
                <h3>Order Information</h3>
                <div class="order-detail-row">
                  <span class="detail-label">Order Number</span>
                  <span class="detail-value">#${order.id}</span>
                </div>
                <div class="order-detail-row">
                  <span class="detail-label">Total Amount</span>
                  <span class="detail-value">$${order.total_amount}</span>
                </div>
                ${order.installation_date ? `
                <div class="order-detail-row">
                  <span class="detail-label">Installation Date</span>
                  <span class="detail-value">${new Date(order.installation_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div class="order-detail-row">
                  <span class="detail-label">Installation Time</span>
                  <span class="detail-value">${order.installation_time || 'To be confirmed'}</span>
                </div>
                ` : ''}
                <div class="order-detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
              </div>

              <div class="signature">
                <p class="signature-name">Way of Glory Media Team</p>
                <p class="signature-title">Customer Success Team</p>
              </div>
            </div>

            <div class="footer">
              <img src="https://wayofglory.com/images/logo/LogçoLight.png" alt="Way of Glory" class="footer-logo" />
              <p>Need assistance? We're here to help!</p>
              <p>Email: <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a></p>
              <p>Phone: <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a></p>
              
              <div class="footer-links">
                <a href="https://wayofglory.com/support">Support</a>
                <a href="https://wayofglory.com/contact">Contact</a>
                <a href="https://wayofglory.com/terms">Terms</a>
                <a href="https://wayofglory.com/privacy">Privacy</a>
              </div>
              
              <div class="social-links">
                <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
                  © ${new Date().getFullYear()} Way of Glory Media. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Add these calculation functions at the top level
const calculateTotalRevenue = (orders: Order[]): { products: number, installation: number } => {
  return orders.reduce((totals, order) => {
    const productRevenue = order.order_items.reduce((sum, item) => {
      const price = typeof item.price_at_time === 'string' ? parseFloat(item.price_at_time) : item.price_at_time;
      return sum + (price * item.quantity);
    }, 0);

    const installationRevenue = order.installation_price ? 
      (typeof order.installation_price === 'string' ? parseFloat(order.installation_price) : order.installation_price) 
      : 0;

    return {
      products: totals.products + productRevenue,
      installation: totals.installation + installationRevenue
    };
  }, { products: 0, installation: 0 });
};

const calculateTotalProfit = (orders: Order[]): { products: number, installation: number } => {
  return orders.reduce((totals, order) => {
    const productProfit = order.order_items.reduce((sum, item) => {
      const price = typeof item.price_at_time === 'string' ? parseFloat(item.price_at_time) : item.price_at_time;
      const cost = typeof item.cost_at_time === 'string' ? parseFloat(item.cost_at_time) : item.cost_at_time;
      const profit = (price - cost) * item.quantity;
      return sum + profit;
    }, 0);

    const installationRevenue = order.installation_price ? 
      (typeof order.installation_price === 'string' ? parseFloat(order.installation_price) : order.installation_price) 
      : 0;

    return {
      products: totals.products + productProfit,
      installation: totals.installation + installationRevenue // 100% profit on installation
    };
  }, { products: 0, installation: 0 });
};

// Add these keyframe animations at the top of the file after the imports
const animationStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) }
    100% { transform: translateX(100%) }
  }
  @keyframes spin {
    from { transform: rotate(0deg) }
    to { transform: rotate(360deg) }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0) }
    40% { transform: translateY(-4px) }
  }
  @keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }
`;

interface EmailLog {
  id: number;
  subject: string;
  content: string;
  sent_at: string;
  template_id?: string;
  status: string;
  preview?: string;
}

// Add this at the top of the file after imports
const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Add this utility function to safely show toasts
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  if (isPWA()) {
    console.log(`PWA mode - suppressing toast: ${type}:`, message);
    return;
  }
  
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'warning') {
    toast.warning(message);
  } else {
    toast.error(message);
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isEmailTemplatesOpen, setIsEmailTemplatesOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [editedSubject, setEditedSubject] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'loading' | 'error'>('edit')
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({})
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false)
  const [shippingStatus, setShippingStatus] = useState('')
  const [isShippingPromptOpen, setIsShippingPromptOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isTemplateLoading, setIsTemplateLoading] = useState(false)
  const [loadingTemplateName, setLoadingTemplateName] = useState('')
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<EmailTabValue>('content')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [emailContent, setEmailContent] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [activeEmailTab, setActiveEmailTab] = useState<EmailTabValue>('content')
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null)
  const [showEmailHistory, setShowEmailHistory] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate revenue and profit totals
  const revenue = calculateTotalRevenue(orders);
  const profit = calculateTotalProfit(orders);
  const profitMargin = orders.length > 0 ? 
    ((profit.products + profit.installation) / (revenue.products + revenue.installation) * 100) : 0;

  const emailTemplates = [
    {
      id: 'payment_reminder',
      title: 'Payment Reminder',
      subject: 'Payment Reminder for Your Way of Glory Order',
      description: 'Remind customer about pending payment',
      icon: DollarSign,
    },
    {
      id: 'installation_confirmation',
      title: 'Installation Confirmation',
      subject: 'Installation Details for Your Way of Glory Order',
      description: 'Confirm installation date and details',
      icon: Wrench,
    },
    {
      id: 'shipping_update',
      title: 'Shipping Update',
      subject: 'Shipping Update for Your Way of Glory Order',
      description: 'Update customer about shipping status',
      icon: Truck,
    },
    {
      id: 'thank_you',
      title: 'Thank You',
      subject: 'Thank You for Your Way of Glory Order',
      description: 'Send a thank you note after completion',
      icon: CheckCircle2,
    },
  ]

  const getEmailTemplate = (templateId: string, order: Order): { subject: string, content?: string } => {
    // Return empty template - actual content will come from server
    return {
      subject: `Order #${order.id} Update`
    };
  };

  const filterAndSortOrders = useCallback(() => {
    let filtered = [...orders]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(order => 
        order.first_name.toLowerCase().includes(searchLower) ||
        order.last_name.toLowerCase().includes(searchLower) ||
        order.email.toLowerCase().includes(searchLower) ||
        order.id.toString().includes(searchLower) ||
        (order.contract_number && order.contract_number.toLowerCase().includes(searchLower))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        switch (dateFilter) {
          case 'today':
            return orderDate === today
          case 'week':
            return orderDate >= weekAgo
          case 'month':
            return orderDate >= monthAgo
          case 'year':
            return orderDate >= yearAgo
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        const aAmount = typeof a.total_amount === 'string' ? parseFloat(a.total_amount) : a.total_amount
        const bAmount = typeof b.total_amount === 'string' ? parseFloat(b.total_amount) : b.total_amount
        if (sortOrder === 'highest') {
          return bAmount - aAmount
        } else {
          return aAmount - bAmount
        }
      }
    })

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, dateFilter, sortOrder])

  useEffect(() => {
    fetchOrders()
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    filterAndSortOrders()
  }, [searchTerm, statusFilter, dateFilter, sortOrder, orders, filterAndSortOrders])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'delayed':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getOrderStatistics = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: {
        products: 0,
        services: 0,
        installation: 0
      },
      profit: {
        products: 0,
        services: 0,
        installation: 0
      },
      totalTax: 0
    };

    orders.forEach(order => {
      const orderRevenue = calculateOrderRevenue(order);
      const orderProfit = calculateOrderProfit(order);

      // Add revenue
      stats.revenue.products += orderRevenue.products;
      stats.revenue.services += orderRevenue.services;
      stats.revenue.installation += orderRevenue.installation;

      // Add profit
      stats.profit.products += orderProfit.products;
      stats.profit.services += orderProfit.services;
      stats.profit.installation += orderProfit.installation;

      // Calculate tax (only on products)
      stats.totalTax += calculateOrderTax(order);
    });

    return stats;
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatusUpdate) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Update local state without waiting for JSON parsing
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      showToast(`Order #${orderId} status has been updated to ${newStatus}`);
      setIsStatusOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast(error instanceof Error ? error.message : "Failed to update order status", 'error');
    }
  };

  const handleDelete = (orderId: number) => {
    handleDeleteOrder(orderId, orders, setOrders);
  };

  const getTemplatePrompt = (templateType: string) => {
    switch (templateType) {
      case 'payment_reminder':
        return `Create a professional payment reminder email with the following requirements:
        
        Subject: Payment Reminder for Order #${selectedOrder?.id}

        Email Content:
        - Start with a polite greeting to ${selectedOrder?.first_name}
        - Remind about the pending payment of $${selectedOrder?.total_amount}
        - Clearly state that we ONLY accept these payment methods:
          * Cash (in person at our office)
          * Check (made payable to Way of Glory)
          * Direct Deposit/Bank Transfer
        - For cash payments: Include our office address and hours
        - For checks: Provide mailing address and check details
        - For direct deposit: Include bank account information
        - Create appropriate urgency while staying professional
        - Include our contact information for payment questions
        - End with a professional signature

        Note: The email must follow our exact HTML structure with header, content, and footer sections.`
      case 'installation_confirmation':
        return `Create a professional installation confirmation email with the following requirements:
        
        Subject: Installation Confirmation for Order #${selectedOrder?.id}

        Email Content:
        - Start with a warm greeting to ${selectedOrder?.first_name}
        - Confirm the installation date: ${selectedOrder?.installation_date}
        - List preparation instructions for the customer
        - Explain what to expect during installation
        - Include our contact information
        - End with a professional signature

        Note: The email must follow our exact HTML structure with header, content, and footer sections.`
      case 'shipping_update':
        return `Create a professional shipping update email with the following requirements:
        
        Subject: Shipping Update for Order #${selectedOrder?.id}

        Email Content:
        - Start with a friendly greeting to ${selectedOrder?.first_name}
        - Inform that their order status is: ${shippingStatus}
        - Provide specific details based on the status:
          ${shippingStatus === 'Processing' ? '* Order is being prepared for shipping\n      * Expected to ship within 1-2 business days' : ''}
          ${shippingStatus === 'Shipped' ? '* Order has been shipped\n      * Include tracking number placeholder\n      * Estimated delivery timeframe' : ''}
          ${shippingStatus === 'Out for Delivery' ? '* Order will be delivered today\n      * Delivery window if available' : ''}
          ${shippingStatus === 'Delayed' ? '* Explain reason for delay\n      * Provide new estimated timeframe\n      * Apologize for inconvenience' : ''}
        - Include any relevant next steps or actions needed
        - Provide customer support contact information
        - End with a professional signature

        Note: The email must follow our exact HTML structure with header, content, and footer sections.`
      case 'thank_you':
        return `Create a professional thank you email with the following requirements:
        
        Subject: Thank You for Your Order #${selectedOrder?.id}

        Email Content:
        - Start with a warm greeting to ${selectedOrder?.first_name}
        - Express sincere gratitude for their business
        - Confirm their order details (Order #${selectedOrder?.id})
        - Provide any relevant follow-up information
        - Encourage future engagement
        - End with a professional signature

        Note: The email must follow our exact HTML structure with header, content, and footer sections.`
      default:
        return emailTemplates.find(t => t.id === templateType)?.description || ''
    }
  }

  const handleShippingUpdate = async (status: string) => {
    setShippingStatus(status)
    setIsShippingPromptOpen(false)
    setIsGeneratingAI(true)
    
    const templatePrompt = `Create a shipping update email for Order #${selectedOrder?.id}.
    Current Status: ${status}

    Guidelines:
    - Only state the current order status
    - Do not include any estimated times or dates unless provided
    - Do not make assumptions about delivery times
    - Provide only factual information about the order
    - Include customer service contact information for questions
    - Keep the message clear and concise

    Note: Stick to only the facts we know about the order status.`

    try {
      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: templatePrompt,
          templateType: 'shipping_update',
          order: selectedOrder,
          viewMode,
          variables: {
            customerName: `${selectedOrder?.first_name} ${selectedOrder?.last_name}`,
            orderNumber: selectedOrder?.id,
            amount: selectedOrder?.total_amount,
            installationDate: selectedOrder?.installation_date,
          }
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      console.log('Generated email content:', {
        html: data.html,
        subject: data.subject,
        responseData: data
      })

      // Store the raw AI-generated content
      setEditedContent(data.html || '')
      setPreviewHtml(data.html || '')
      setEditedSubject(data.subject || '')
      setIsAiPromptOpen(false)
      toast.success('Email content generated successfully')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate content. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Clear email state function
  const clearEmailState = () => {
    console.log('Clearing email state')
    console.log('Previous state:', {
      hasPreviewHtml: !!previewHtml,
      hasEditedSubject: !!editedSubject,
      hasEditedContent: !!editedContent,
      selectedTemplate,
      viewMode
    })
    
    setPreviewHtml('')
    setEditedSubject('')
    setEditedContent('')
    setSelectedTemplate(null)
    setViewMode('edit')
    setTemplateVars({})
    setIsGeneratingAI(false)
    setSendingTemplateId(null)
    setAiPrompt('')
  }

  // Handle email templates dialog
  const handleEmailTemplatesOpenChange = (open: boolean) => {
    if (!open && !isTemplateLoading) {
      clearEmailState()
    }
    setIsEmailTemplatesOpen(open)
  }

  // Handle template selection and generation
  const handleTemplateSelect = async (templateId: string) => {
    if (!selectedOrder) {
      showToast('Please select an order first', 'error')
      return
    }

    try {
      const template = emailTemplates.find(t => t.id === templateId)
      clearEmailState()
      setPreviewHtml('<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div><p class="text-gray-500">Loading template...</p></div></div>')
      setIsGeneratingAI(true)
      setIsTemplateLoading(true)
      setLoadingTemplateName(template?.title || 'Email Template')

      // Use the API to generate the content
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/preview-template?templateId=${templateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-pwa-request': 'true'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Template generation error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Failed to generate template: ${response.statusText}`)
      }

      const data = await response.json()
      
      // If we have content, use it
      if (data.html || data.content) {
        setEditedContent(data.content || '')
        setPreviewHtml(data.html || data.content || '')
        setEditedSubject(data.subject || '')
        setIsAiPromptOpen(false)
        showToast('Template generated successfully')
      } else {
        // Show error if we have no content
        throw new Error('No content received from template generation')
      }

    } catch (err) {
      console.error('Error generating template:', err)
      setPreviewHtml('')
      showToast(err instanceof Error ? err.message : 'Failed to generate email template. Please try again.', 'error')
    } finally {
      setIsGeneratingAI(false)
      setIsTemplateLoading(false)
      setLoadingTemplateName('')
    }
  }

  // Handle email generation
  const handleGenerateEmail = async () => {
    try {
      if (!selectedOrder) {
        showToast("Please select an order first", 'error');
        return;
      }
      
      // Show the email composer first
      setShowEmailComposer(true);
      
      // Then open the AI prompt dialog
      setIsAiPromptOpen(true);
      setIsGeneratingEmail(false);
      setIsGeneratingAI(false);
    } catch (error) {
      console.error('Error in handleGenerateEmail:', error);
      showToast("Failed to open AI prompt", 'error');
    }
  };

  const handleAiPromptSubmit = async (prompt: string) => {
    if (!selectedOrder) {
      showToast('Please select an order first', 'error');
      return;
    }

    try {
      setIsGeneratingAI(true);
      setIsTemplateLoading(true);
      setLoadingTemplateName('Generating custom email...');

      // Use the preview-template endpoint with custom_email template
      const response = await fetch(
        `/api/admin/orders/${selectedOrder.id}/preview-template?templateId=custom_email&prompt=${encodeURIComponent(prompt)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-pwa-request': 'true'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }

      // Set the content and preview HTML
      setContent(data.content || data.html);
      setEditedContent(data.content || data.html);
      setPreviewHtml(data.html || data.content);
      
      if (data.subject) {
        setSubject(data.subject);
        setEditedSubject(data.subject);
      }

      // Switch to content tab after generation
      setViewMode('edit');
      setIsAiPromptOpen(false);
      showToast('Email generated successfully');

    } catch (error) {
      console.error('Error generating email:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate email',
        'error'
      );
    } finally {
      setIsGeneratingAI(false);
      setIsTemplateLoading(false);
      setLoadingTemplateName('');
    }
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!selectedOrder?.id) {
      showToast('No order selected', 'error');
      return;
    }

    try {
      setIsSendingEmail(true);
      
      // Use fallback values if email content or subject are missing
      const finalContent = editedContent || '<p>No email content was generated.</p>';
      const finalSubject = editedSubject || `Your Way of Glory Order #${selectedOrder.id}`;

      if(!editedContent || !editedSubject) {
        showToast('Some fields were missing. Fallback values have been used.');
      }

      console.log('Email content state:', {
        hasEditedContent: !!editedContent,
        editedContentLength: editedContent?.length,
        hasEditedSubject: !!editedSubject,
        editedSubject: editedSubject,
        finalContent: finalContent?.slice(0, 100) + '...' // Log first 100 chars
      });

      // Send the email using the send-template endpoint
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 'custom',
          customEmail: {
            subject: finalSubject,
            content: finalContent,
            html: previewHtml  // Use the previewHtml which contains the fully formatted content
          },
          isPWA: isPWA()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Send email failed:', {
          status: response.status,
          data: data
        });
        throw new Error(data.details || data.error || 'Failed to send email');
      }

      showToast('Email sent successfully');
      
      // Reset all states
      clearEmailState();
      setPreviewHtml('');
      setViewMode('edit');
      setIsEmailTemplatesOpen(false);
      setTemplateVars({});
      setIsGeneratingAI(false);
      setAiPrompt('');
      setIsAiPromptOpen(false);
      setShippingStatus('');
      setIsShippingPromptOpen(false);
      
    } catch (error) {
      console.error('Error in handleSendEmail:', error);
      showToast(error instanceof Error ? error.message : 'Failed to send email', 'error');
    } finally {
      setIsSendingEmail(false);  // Clear the loading state
    }
  };

  // Handle quick generate
  const handleQuickGenerate = async (templateId: string) => {
    if (!selectedOrder) {
      showToast('Please select an order first', 'error');
      return;
    }

    try {
      setIsTemplateLoading(true);
      setLoadingTemplateName(`Generating ${templateId} template...`);
      setShowEmailComposer(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `/api/admin/orders/${selectedOrder.id}/preview-template?templateId=${templateId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'x-pwa-request': 'true',
            'x-timestamp': Date.now().toString()
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate template' }));
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const data = await response.json();

      if (!data.content && !data.html) {
        throw new Error('No content received from server');
      }

      // Set the content and preview HTML
      setContent(data.content || data.html);
      setEditedContent(data.content || data.html);
      setPreviewHtml(data.html || data.content);
      
      if (data.subject) {
        setSubject(data.subject);
        setEditedSubject(data.subject);
      }

      handleEmailTabChange('content');
      setIsGeneratingEmail(false);
      showToast('Template generated successfully', 'success');
    } catch (error: any) {
      console.error('Error generating template:', error);
      showToast(error.message || 'Failed to generate template', 'error');
      setShowEmailComposer(false);
    } finally {
      setIsTemplateLoading(false);
      setLoadingTemplateName('');
    }
  };

  // Handle new email
  const handleNewEmail = () => {
    clearEmailState()
  }

  const isServiceOnlyOrder = (order: Order): boolean => {
    return order.order_items.every(item => isServiceItem(item));
  };

  // Add this before the return statement
  const handleProductClick = (item: OrderItem) => {
    setSelectedProduct(item);
    setIsProductDetailsOpen(true);
  };

  const fetchEmailLogs = async (orderId: number) => {
    try {
      setIsLoadingEmailLogs(true);
      const response = await fetch(`/api/admin/orders/${orderId}/email-logs`);
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error("Failed to fetch email history");
    } finally {
      setIsLoadingEmailLogs(false);
    }
  };

  // Update handleDetailsOpen to fetch email logs
  const handleDetailsOpen = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    fetchEmailLogs(order.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Add email history section to the order details dialog
  const renderEmailHistory = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5">
            <Mail className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email History</h3>
            <p className="text-sm text-gray-500">Previous communications</p>
          </div>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
        {isLoadingEmailLogs ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="text-gray-500">Loading emails...</p>
            </div>
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No emails yet</p>
            <p className="text-sm text-gray-500 mt-1">Sent emails will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => {
                  handleEmailLogClick(log);
                  setViewMode('preview');
                  setIsEmailTemplatesOpen(true);
                  setActiveEmailTab('content');
                }}
                className="group relative p-4 rounded-xl border border-gray-100 hover:border-blue-100 bg-white hover:bg-blue-50/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEmailLogClick(log);
                    setViewMode('preview');
                    setIsEmailTemplatesOpen(true);
                    setActiveEmailTab('content');
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-medium text-gray-900 truncate pr-8">{log.subject}</h4>
                      <time className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{formatDate(log.sent_at)}</time>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{log.preview}</p>
                    {log.template_id && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {log.template_id.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Add pagination calculation
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const stats = getOrderStatistics()

  // Fix the selectedProduct type safety issues
  const ProductDetails: FC<{ product: OrderItem | null, isFullScreen?: boolean }> = ({ product, isFullScreen }) => {
    if (!product?.product) return null;
    
    const price = formatPrice(product.price_at_time);
    const totalPrice = formatPrice(Number(product.price_at_time) * product.quantity);
    const taxAmount = formatPrice(Number(product.price_at_time) * product.quantity * 0.0775);

    return (
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isFullScreen ? 'w-full max-w-4xl mx-auto' : ''}`}>
        {/* Header Section */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{product.product.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {product.product.category || 'No category'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${price}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <Badge variant="outline" className="text-base bg-white">
                  Quantity: {product.quantity}
                </Badge>
                <Badge variant="outline" className="text-base bg-white">
                  Total: ${totalPrice}
                </Badge>
              </div>
              {!product.product.is_service && (
                <div className="text-sm text-gray-500 mt-2">
                  + ${taxAmount} tax
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Section */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div className="text-blue-700 font-medium">Type</div>
              </div>
              <div className="text-gray-900 font-medium">{product.product.is_service ? 'Service' : 'Product'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div className="text-green-700 font-medium">Unit Price</div>
              </div>
              <div className="text-gray-900 font-medium">${price}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-purple-600" />
                <div className="text-purple-700 font-medium">Quantity</div>
              </div>
              <div className="text-gray-900 font-medium">{product.quantity} units</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div className="text-orange-700 font-medium">Total</div>
              </div>
              <div className="text-gray-900 font-medium">${totalPrice}</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        {product.product.features && product.product.features.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.product.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Details Section */}
        {product.product.technical_details && Object.keys(product.product.technical_details).length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.product.technical_details).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm">
                  <dt className="text-sm font-medium text-gray-500 mb-1">{key}</dt>
                  <dd className="text-gray-900 font-medium">{value as string}</dd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Included Items Section */}
        {product.product.included_items && product.product.included_items.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              What's Included
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.product.included_items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warranty Section */}
        {product.product.warranty_info && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Warranty Information
            </h3>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{product.product.warranty_info}</p>
              </div>
            </div>
          </div>
        )}

        {/* Installation Section */}
        {product.product.installation_available && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Professional Installation Available</h3>
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    Our expert team can handle the complete installation of this product. Installation service includes:
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Professional setup and configuration
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Testing and quality assurance
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Post-installation support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleEmailSent = () => {
    setShowEmailComposer(false);
    setActiveEmailTab('content');
    setEditedContent('');
    setEmailSubject('');
    setEditedSubject('');
    setTemplateVars({});
    setIsGeneratingAI(false);
    setIsGeneratingEmail(false);
    setIsSendingEmail(false);
    setSendingTemplateId(null);
    setAiPrompt('');
    setIsAiPromptOpen(false);
    setShippingStatus('');
    setIsShippingPromptOpen(false);
    setIsTemplateLoading(false);
    setLoadingTemplateName('');
    setEmailLogs([]);
    setIsLoadingEmailLogs(false);
  };

  const handleCloseEmailComposer = () => {
    setShowEmailComposer(false);
    setActiveEmailTab('content');
    setEditedContent('');
    setEmailSubject('');
    setEditedSubject('');
    setTemplateVars({});
    setIsGeneratingAI(false);
    setIsGeneratingEmail(false);
    setIsSendingEmail(false);
    setSendingTemplateId(null);
    setAiPrompt('');
    setIsAiPromptOpen(false);
    setShippingStatus('');
    setIsShippingPromptOpen(false);
    setIsTemplateLoading(false);
    setLoadingTemplateName('');
    setEmailLogs([]);
    setIsLoadingEmailLogs(false);
  };

  const handleEmailTabChange = (tab: EmailTabValue) => {
    setActiveEmailTab(tab);
  };

  const handleEmailLogClick = (log: EmailLog) => {
    // Format the content with proper HTML structure
    const formattedContent = formatEmailPreview({
      subject: log.subject,
      content: log.content,
      order: selectedOrder
    });

    // Set the formatted content
    setEditedContent(formattedContent);
    setPreviewHtml(formattedContent);
    setEditedSubject(log.subject);
    setIsEmailTemplatesOpen(true);
    setActiveEmailTab('content');
    setViewMode('preview');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-8 space-y-8 bg-gray-50/50">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-200">
                <PackageSearch className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sales & Orders
                </h1>
                <p className="mt-1.5 text-gray-500">
                  Manage your orders, installations, and customer communications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">{stats.total} Total Orders</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-medium">${(stats.revenue.products + stats.revenue.services + stats.revenue.installation).toFixed(2)} Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-medium">${(stats.profit.products + stats.profit.services + stats.profit.installation).toFixed(2)} Profit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Orders Stats */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Orders Overview</h3>
            <div className="w-24">
              <Select defaultValue="thisMonth">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-gray-500">Cancelled</p>
            </div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white">
          <h3 className="text-sm font-medium text-gray-500 mb-6">Revenue Overview</h3>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Revenue</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <p className="text-sm text-gray-600">Products</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${stats.revenue.products.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm text-gray-600">Services</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    ${stats.revenue.services.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm text-gray-600">Installation</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    ${stats.revenue.installation.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Total Revenue</p>
                  <p className="text-base font-bold text-gray-900">
                    ${(stats.revenue.products + stats.revenue.services + stats.revenue.installation).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profit Section */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Profit</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <p className="text-sm text-gray-600">Products (20%)</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    ${(stats.profit.products).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <p className="text-sm text-gray-600">Services & Installation (100%)</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    ${(stats.profit.services + stats.profit.installation).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Total Profit</p>
                  <p className="text-base font-bold text-emerald-600">
                    ${(stats.profit.products + stats.profit.services + stats.profit.installation).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Stats */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Tax Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalTax.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Total Tax Collected</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Tax Rate</p>
                <p className="text-sm font-medium text-gray-900">7.75%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Average Tax per Order</p>
                <p className="text-sm font-medium text-gray-900">
                  ${(stats.totalTax / stats.total).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Stats */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Installation Revenue</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${orders.reduce((sum, order) => sum + Number(order.installation_price || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total Installation Revenue</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Orders with Installation</p>
                <p className="text-sm font-medium text-gray-900">
                  {orders.filter(order => Number(order.installation_price) > 0).length}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Average Installation Price</p>
                <p className="text-sm font-medium text-gray-900">
                  ${(orders.reduce((sum, order) => sum + Number(order.installation_price || 0), 0) / 
                     orders.filter(order => Number(order.installation_price) > 0).length || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 border-gray-200/50 focus:bg-white transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <Select 
              value={statusFilter} 
              onValueChange={(value: OrderStatus) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px] bg-white/50 backdrop-blur-sm border-gray-200/50 shadow-sm hover:bg-white/80 transition-all">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-gray-700">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-yellow-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="confirmed" className="text-blue-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmed
                  </div>
                </SelectItem>
                <SelectItem value="completed" className="text-green-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="cancelled" className="text-red-600">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancelled
                  </div>
                </SelectItem>
                <SelectItem value="delayed" className="text-orange-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delayed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select 
              value={dateFilter} 
              onValueChange={setDateFilter}
            >
              <SelectTrigger className="w-[180px] bg-white/50 backdrop-blur-sm border-gray-200/50 shadow-sm hover:bg-white/80 transition-all">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    All Time
                  </div>
                </SelectItem>
                <SelectItem value="today" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Today
                  </div>
                </SelectItem>
                <SelectItem value="week" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Week
                  </div>
                </SelectItem>
                <SelectItem value="month" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Month
                  </div>
                </SelectItem>
                <SelectItem value="year" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    This Year
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select 
              value={sortOrder} 
              onValueChange={(value: SortOrder) => setSortOrder(value)}
            >
              <SelectTrigger className="w-[180px] bg-white/50 backdrop-blur-sm border-gray-200/50 shadow-sm hover:bg-white/80 transition-all">
                <SelectValue placeholder="Sort orders" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="newest" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="oldest" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="highest" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Highest Amount
                  </div>
                </SelectItem>
                <SelectItem value="lowest" className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Lowest Amount
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {(statusFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Active Filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStatusFilter('all')}
                />
              </Badge>
            )}
            {dateFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Date: {dateFilter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setDateFilter('all')}
                />
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSearchTerm('')}
                />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setSearchTerm('');
              }}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-sm font-medium text-gray-600">Order Details</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-blue-50/50 transition-all duration-200">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-600">
                        #{order.id}
                      </span>
                      {order.contract_number && (
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded mt-1 w-fit">
                          {order.contract_number}
                        </span>
                      )}
                      {order.order_creator && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 flex items-center gap-1.5 w-fit">
                          <User className="h-3 w-3" />
                          {order.order_creator}
                        </span>
                      )}
                      <span className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {order.first_name} {order.last_name}
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a 
                            href={`mailto:${order.email}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {order.email}
                          </a>
                        </div>
                        {order.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a 
                              href={`tel:${order.phone}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {order.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">
                        ${formatPrice(order.total_amount)}
                      </span>
                      {isServiceOnlyOrder(order) ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block w-fit mt-1">
                          No Tax (Service)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600 mt-1">
                          Includes ${formatPrice(calculateOrderTax(order))} tax
                        </span>
                      )}
                      {Number(order.installation_price) > 0 && (
                        <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Installation: ${formatPrice(order.installation_price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className={`capitalize font-medium px-3 py-1.5 text-sm rounded-full shadow-sm ${getStatusColor(order.status)} flex items-center gap-1 w-fit`}
                    >
                      {order.status === 'pending' && <Clock className="h-3 w-3" />}
                      {order.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                      {order.status === 'delayed' && <Clock className="h-3 w-3" />}
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => {
                          handleDetailsOpen(order);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {order.signature_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          onClick={() => {
                            setSelectedSignature(order.signature_url);
                          }}
                        >
                          <PenTool className="h-4 w-4" />
                          Signature
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 hover:bg-green-50 hover:text-green-600 transition-colors"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsStatusOpen(true);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Status
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                Showing {Math.min(itemsPerPage * (currentPage - 1) + 1, filteredOrders.length)} to{' '}
                {Math.min(itemsPerPage * currentPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 ${
                        currentPage === pageNumber 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : ""
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog 
        open={isDetailsOpen} 
        onOpenChange={(open: boolean) => setIsDetailsOpen(open)}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white p-0">
          {selectedOrder && (
            <>
              {/* Enhanced Header */}
              <div className="sticky top-0 z-50 bg-white border-b">
                <div className="px-8 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Order #{selectedOrder.id}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {selectedOrder.order_creator && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                              <User className="h-3 w-3" />
                              Created by {selectedOrder.order_creator}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {selectedOrder.contract_number && (
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                              <FileText className="h-3 w-3" />
                                Contract #
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                  {selectedOrder.contract_number}
                                </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getStatusVariant(selectedOrder.status)}
                        className={`capitalize text-sm px-4 py-1.5 rounded-full shadow-sm ${
                          selectedOrder.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          selectedOrder.status === 'confirmed' ? 'bg-blue-500 hover:bg-blue-600' :
                          selectedOrder.status === 'completed' ? 'bg-green-500 hover:bg-green-600' :
                          selectedOrder.status === 'cancelled' ? 'bg-red-500 hover:bg-red-600' :
                          'bg-orange-500 hover:bg-orange-600'
                        } text-white flex items-center gap-2`}
                      >
                        {selectedOrder.status === 'pending' && <Clock className="h-4 w-4" />}
                        {selectedOrder.status === 'confirmed' && <CheckCircle2 className="h-4 w-4" />}
                        {selectedOrder.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                        {selectedOrder.status === 'cancelled' && <XCircle className="h-4 w-4" />}
                        {selectedOrder.status === 'delayed' && <Clock className="h-4 w-4" />}
                        {selectedOrder.status}
                      </Badge>
                      <Badge
                        variant={
                          selectedOrder.payment_status === 'completed' ? 'default' :
                          selectedOrder.payment_status === 'partial' ? 'secondary' :
                          'outline'
                        }
                        className={`capitalize text-sm px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2 ${
                          selectedOrder.payment_status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          selectedOrder.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                          'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <DollarSign className="h-4 w-4" />
                        {selectedOrder.payment_status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Opening email dialog...');
                          console.log('Selected order:', selectedOrder);
                          setIsEmailTemplatesOpen(true);
                        }}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStatusOpen(true)}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Update Status
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFullScreen(!isFullScreen)}
                          className="rounded-full hover:bg-gray-100"
                        >
                          {isFullScreen ? (
                            <Minimize2 className="h-5 w-5" />
                          ) : (
                            <Maximize2 className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsDetailsOpen(false)}
                          className="rounded-full hover:bg-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
              </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${formatPrice(selectedOrder.total_amount)}
                        </p>
                        </div>
                      </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="bg-green-50 rounded-lg p-2">
                        <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                        <p className="text-sm text-gray-500">Items</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedOrder.order_items.length}
                        </p>
                        </div>
                      </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="bg-purple-50 rounded-lg p-2">
                        <Wrench className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                        <p className="text-sm text-gray-500">Installation</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${formatPrice(selectedOrder.installation_price)}
                        </p>
                        </div>
                      </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="bg-orange-50 rounded-lg p-2">
                        <Receipt className="h-5 w-5 text-orange-600" />
                    </div>
                      <div>
                        <p className="text-sm text-gray-500">Tax</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${formatPrice(calculateOrderTax(selectedOrder))}
                        </p>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Content */}
              <div className="p-8">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-14 bg-transparent p-0 mb-8">
                    <TabsTrigger 
                      value="details"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none h-14 px-8 gap-2 transition-all hover:text-blue-600"
                    >
                      <User className="h-4 w-4" />
                      Customer Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="items"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none h-14 px-8 gap-2 transition-all hover:text-blue-600"
                    >
                      <Package className="h-4 w-4" />
                      Order Items
                    </TabsTrigger>
                    <TabsTrigger 
                      value="payments"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none h-14 px-8 gap-2 transition-all hover:text-blue-600"
                    >
                      <DollarSign className="h-4 w-4" />
                      Payments
                    </TabsTrigger>
                    <TabsTrigger 
                      value="communications"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none h-14 px-8 gap-2 transition-all hover:text-blue-600"
                    >
                      <Mail className="h-4 w-4" />
                      Communications
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0 border-none p-0">
                    <div className="grid grid-cols-3 gap-6">
                {/* Customer Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-900">Customer Details</h3>
                      </div>
                        <div className="bg-white border rounded-xl overflow-hidden">
                          <div className="p-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Full Name</p>
                              <p className="font-medium text-gray-900">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                      </div>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <a 
                                href={`mailto:${selectedOrder.email}`}
                                className="font-medium text-blue-600 hover:text-blue-700"
                              >
                                {selectedOrder.email}
                              </a>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <a 
                                href={`tel:${selectedOrder.phone}`}
                                className="font-medium text-blue-600 hover:text-blue-700"
                              >
                                {selectedOrder.phone}
                              </a>
                    </div>
                    {selectedOrder.organization && (
                              <div>
                                <p className="text-sm text-gray-500">Organization</p>
                                <p className="font-medium text-gray-900">{selectedOrder.organization}</p>
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-900">Shipping Information</h3>
                      </div>
                        <div className="bg-white border rounded-xl overflow-hidden">
                          <div className="p-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Delivery Address</p>
                              <p className="font-medium text-gray-900">
                          {selectedOrder.shipping_address}<br />
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}
                              </p>
                    </div>
                    {selectedOrder.shipping_instructions && (
                              <div>
                                <p className="text-sm text-gray-500">Special Instructions</p>
                                <p className="font-medium text-gray-900">{selectedOrder.shipping_instructions}</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>

                      {/* Installation Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-900">Installation Information</h3>
                      </div>
                        <div className="bg-white border rounded-xl overflow-hidden">
                          <div className="p-4 space-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Installation Date & Time</p>
                              <p className="font-medium text-gray-900">
                          {new Date(selectedOrder.installation_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {selectedOrder.installation_time && ` at ${selectedOrder.installation_time}`}
                              </p>
                      </div>
                            <div>
                              <p className="text-sm text-gray-500">Installation Location</p>
                              <p className="font-medium text-gray-900">
                                {selectedOrder.installation_address}<br />
                                {selectedOrder.installation_city}, {selectedOrder.installation_state} {selectedOrder.installation_zip}
                              </p>
                    </div>
                            {selectedOrder.access_instructions && (
                              <div>
                                <p className="text-sm text-gray-500">Access Instructions</p>
                                <p className="font-medium text-gray-900">{selectedOrder.access_instructions}</p>
                              </div>
                            )}
                            {(selectedOrder.contact_onsite || selectedOrder.contact_onsite_phone) && (
                              <div>
                                <p className="text-sm text-gray-500">Onsite Contact</p>
                                <p className="font-medium text-gray-900">
                                  {selectedOrder.contact_onsite}
                                  {selectedOrder.contact_onsite_phone && (
                                    <>
                                      <br />
                            <a 
                              href={`tel:${selectedOrder.contact_onsite_phone}`}
                                        className="text-blue-600 hover:text-blue-700"
                            >
                              {selectedOrder.contact_onsite_phone}
                            </a>
                                    </>
                    )}
                                </p>
                      </div>
                    )}
                  </div>
                </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="mt-0 border-none p-0">
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50/50">
                            <tr>
                              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                              <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.order_items.map((item, index) => (
                              <tr 
                        key={index}
                                className="group hover:bg-blue-50/50 cursor-pointer transition-all"
                        onClick={() => handleProductClick(item)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 rounded-lg p-2 hidden group-hover:flex">
                                      <Package className="h-5 w-5 text-blue-500" />
                            </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {item.product?.title}
                                      </p>
                                      {item.product?.category && (
                                        <p className="text-sm text-gray-500">
                                          {item.product.category}
                                        </p>
              )}
              </div>
                                    <div className="hidden group-hover:block">
                                      <Eye className="h-4 w-4 text-blue-500" />
            </div>
                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-gray-100 text-gray-800 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                                    ${formatPrice(item.price_at_time)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    ${formatPrice(Number(item.price_at_time) * item.quantity)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50/50">
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">Subtotal</td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                ${formatPrice(selectedOrder.order_items.reduce((sum, item) => 
                                  sum + (Number(item.price_at_time) * item.quantity), 0))}
                              </td>
                            </tr>
                            {Number(selectedOrder.installation_price) > 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">Installation</td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                  ${formatPrice(selectedOrder.installation_price)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">Tax (7.75%)</td>
                              <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                ${formatPrice(calculateOrderTax(selectedOrder))}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-gray-200">
                              <td colSpan={3} className="px-6 py-4 text-right text-base font-semibold text-gray-900">Total Amount</td>
                              <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                                ${formatPrice(selectedOrder.total_amount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                    </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="payments" className="mt-0 border-none p-0">
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <PaymentManager
                        orderId={selectedOrder.id}
                        totalAmount={parseFloat(selectedOrder.total_amount.toString())}
                        paymentPlan={selectedOrder.paymentPlan}
                        dueToday={selectedOrder.dueToday}
                        totalDueAfterFirst={selectedOrder.totalDueAfterFirst}
                        paymentFrequency={selectedOrder.paymentFrequency}
                        onPaymentComplete={() => {
                          fetchOrders();
                        }}
                      />
                    </div>
                    </TabsContent>

                  <TabsContent value="communications" className="mt-0 border-none p-0">
                    <div className="space-y-6">
                      {/* Signature Section */}
                      {selectedOrder.signature_url && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <PenTool className="h-4 w-4 text-gray-400" />
                              <h3 className="text-sm font-medium text-gray-900">Customer Signature</h3>
                          </div>
                            <img 
                              src={selectedOrder.signature_url} 
                              alt="Customer Signature" 
                              className="max-h-32 object-contain"
                            />
                          </div>
                          </div>
                      )}

                      {/* Email History */}
                      {renderEmailHistory()}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
                        </>
                      )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog 
        open={!!selectedSignature} 
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedSignature(null)
            setIsFullScreen(false)
          }
        }}
      >
        <DialogContent className={`bg-white p-0 rounded-2xl shadow-xl transition-all duration-200 ${
          isFullScreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-2xl'
        }`}>
          <DialogHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-gray-500" />
                  Customer Signature
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
                  >
                    {isFullScreen ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">
                      {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSignature(null)
                      setIsFullScreen(false)
                    }}
                    className="rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Close</span>
                  </button>
              </div>
            </div>
          </DialogHeader>
          <div className={`p-6 ${isFullScreen ? 'h-[calc(95vh-88px)]' : ''}`}>
            <div className={`bg-gray-50 p-8 rounded-xl border border-gray-200 ${
              isFullScreen ? 'h-full flex items-center justify-center' : ''
            }`}>
              {selectedSignature && (
                <img 
                  src={selectedSignature} 
                  alt="Customer Signature" 
                  className={`object-contain mx-auto cursor-pointer ${
                    isFullScreen ? 'max-h-[calc(95vh-200px)]' : 'max-h-[400px]'
                  }`}
                  onClick={() => setIsFullScreen(!isFullScreen)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog 
        open={isStatusOpen} 
        onOpenChange={(open: boolean) => setIsStatusOpen(open)}
      >
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Update Order Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              {(['pending', 'confirmed', 'completed', 'cancelled', 'delayed'] as const).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={`w-full justify-start gap-3 py-6 text-left group hover:border-blue-200 hover:bg-blue-50/50 ${
                    selectedOrder?.status === status ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (selectedOrder) {
                      updateOrderStatus(selectedOrder.id, status);
                      setIsStatusOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {status === 'pending' && (
                      <Clock className={`h-5 w-5 ${selectedOrder?.status === status ? 'text-blue-500' : 'text-yellow-500 group-hover:text-blue-500'}`} />
                    )}
                    {status === 'confirmed' && (
                      <CheckCircle2 className={`h-5 w-5 ${selectedOrder?.status === status ? 'text-blue-500' : 'text-green-500 group-hover:text-blue-500'}`} />
                    )}
                    {status === 'completed' && (
                      <CheckCircle2 className={`h-5 w-5 ${selectedOrder?.status === status ? 'text-blue-500' : 'text-green-500 group-hover:text-blue-500'}`} />
                    )}
                    {status === 'cancelled' && (
                      <XCircle className={`h-5 w-5 ${selectedOrder?.status === status ? 'text-blue-500' : 'text-red-500 group-hover:text-blue-500'}`} />
                    )}
                    {status === 'delayed' && (
                      <Clock className={`h-5 w-5 ${selectedOrder?.status === status ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'}`} />
                    )}
                    <div>
                      <div className="font-medium capitalize">{status}</div>
                      <div className="text-sm text-gray-500">
                        {status === 'pending' && 'Order is awaiting confirmation'}
                        {status === 'confirmed' && 'Order has been confirmed and is being processed'}
                        {status === 'completed' && 'Order has been completed and delivered'}
                        {status === 'cancelled' && 'Order has been cancelled'}
                        {status === 'delayed' && 'Order is delayed'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsStatusOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog 
        open={isProductDetailsOpen} 
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedProduct(null);
            setIsProductDetailsOpen(false);
            setIsFullScreen(false);
          }
        }}
      >
        <DialogContent className={`bg-white p-0 rounded-2xl shadow-xl transition-all duration-200 ${
          isFullScreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl'
        }`}>
          <DialogHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Product Details
              </DialogTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsProductDetailsOpen(false);
                    setIsFullScreen(false);
                  }}
                  className="rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className={`p-6 ${isFullScreen ? 'h-[calc(95vh-88px)] overflow-y-auto' : ''}`}>
            <ProductDetails product={selectedProduct} isFullScreen={isFullScreen} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Templates Dialog */}
      <Dialog 
        open={isEmailTemplatesOpen} 
        onOpenChange={handleEmailTemplatesOpenChange}
      >
        <DialogContent className="max-w-7xl h-[90vh] bg-white p-0 gap-0">
          <DialogHeader className="sticky top-0 z-50 bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {selectedTemplate ? emailTemplates.find(t => t.id === selectedTemplate)?.title : 'Create Email'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                      {selectedTemplate ? 'Edit and customize your email template' : 'Create a new email or use a template'}
                    </p>
                  </div>
                </DialogTitle>
                {(selectedTemplate || editedContent) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 transition-all px-4 ${
                        viewMode === 'edit' 
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setViewMode('edit')}
                    >
                      <Code className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 transition-all px-4 ${
                        viewMode === 'preview' 
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setViewMode('preview')}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Left Sidebar */}
            <div className="w-80 border-r overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
              <div className="p-6 space-y-6">
                {/* Quick Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all py-6 rounded-xl font-medium group"
                    onClick={() => {
                      clearEmailState();
                      setSelectedTemplate(null);
                      setPreviewHtml('');
                      setEditedSubject('');
                      setTemplateVars({});
                      setViewMode('edit');
                      setIsGeneratingEmail(true);
                      setLoadingTemplateName('Creating New Email...');
                      setShowEmailComposer(true);
                      setTimeout(() => {
                        setIsGeneratingEmail(false);
                        setLoadingTemplateName('');
                      }, 1000);
                    }}
                  >
                    <div className="bg-blue-500/20 rounded-lg p-1">
                      <Plus className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Create New Email</span>
                      <span className="text-xs opacity-90">Start from scratch</span>
                    </div>
                  </Button>

                  <Button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all py-6 rounded-xl font-medium group"
                  >
                    <div className="bg-blue-500/20 rounded-lg p-1">
                      <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <span>Generate with AI</span>
                  </Button>
                </div>

                {/* Templates Section */}
                <div className="pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2 px-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Smart Templates
                  </h4>

                  <div className="space-y-2">
                    {emailTemplates.map((tmpl) => {
                      const isSelected = selectedTemplate === tmpl.id;
                      const isLoading = isTemplateLoading && loadingTemplateName === tmpl.title;
                      return (
                        <div
                          key={tmpl.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md' 
                              : 'border-gray-100 hover:border-blue-100 hover:bg-gradient-to-br hover:from-gray-50 hover:to-white hover:shadow-sm'
                          }`}
                          onClick={() => !isLoading && !sendingTemplateId && handleTemplateSelect(tmpl.id)}
                        >
                          <div className={`p-2.5 rounded-xl ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200' 
                              : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 group-hover:border-blue-200'
                          }`}>
                            {isLoading ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            ) : sendingTemplateId === tmpl.id ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            ) : (
                              <tmpl.icon className={`h-5 w-5 ${
                                isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'
                              } transition-colors`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${
                              isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'
                            } transition-colors`}>
                              {isLoading ? `Generating ${tmpl.title}...` : tmpl.title}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                              {tmpl.description}
                            </p>
                          </div>
                          <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-gray-50">
              <div className="p-8 space-y-6 max-w-4xl mx-auto">
                {/* Subject Line */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email Subject
                  </Label>
                  <Input
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full bg-white border-gray-200 shadow-sm"
                    placeholder="Enter email subject..."
                  />
                </div>

                {/* Email Content */}
                <div className="w-full">
                  {viewMode === 'edit' ? (
                    <div className="relative">
                      {isGeneratingEmail && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                          <div className="bg-white border rounded-xl shadow-lg p-6 max-w-sm mx-auto text-center">
                            <div className="flex justify-center mb-4">
                              {isGeneratingAI ? (
                                <div className="flex flex-col items-center gap-2">
                                  <span>Generating with AI</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.2s]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.4s]" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <span>Generating Email</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.2s]" />
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.4s]" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-3">This may take a few moments</p>
                          </div>
                        </div>
                      )}
                      <EmailComposer
                        orderId={String(selectedOrder?.id || '')}
                        initialContent={editedContent}
                        onContentChange={(content) => {
                          setEditedContent(content);
                        }}
                        onSubjectChange={(subject) => setEditedSubject(subject)}
                        subject={editedSubject}
                        onEmailSent={handleEmailSent}
                        isTemplateLoading={isTemplateLoading}
                        loadingTemplateName={loadingTemplateName}
                        activeTab={activeEmailTab}
                        onTabChange={handleEmailTabChange}
                        isAiPromptOpen={isAiPromptOpen}
                        onAiPromptOpenChange={setIsAiPromptOpen}
                        onAiPromptSubmit={handleAiPromptSubmit}
                        isGeneratingAI={isGeneratingAI}
                        previewHtml={previewHtml}
                        onPreviewHtmlChange={(html) => setPreviewHtml(html)}
                      />
                    </div>
                  ) : (
                    <EmailPreview 
                      html={previewHtml} 
                      height="600px" 
                      width="100%" 
                      onSendEmail={handleSendEmail}
                      isSending={isSendingEmail}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  ) // End of return
} // End of OrdersPage

//for push