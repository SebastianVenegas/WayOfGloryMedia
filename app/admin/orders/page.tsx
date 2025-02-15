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
      method: 'POST',
    });

    if (response.ok) {
      toast.success(`Order confirmation email has been resent for order #${orderId}`);
    } else {
      throw new Error('Failed to resend email');
    }
  } catch (error) {
    console.error('Error resending email:', error);
    toast.error("Failed to resend email. Please try again.");
  }
}

const handleDeleteOrder = async (orderId: number, orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>>) => {
  if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setOrders(orders.filter((order: Order) => order.id !== orderId));
      toast.success(`Order #${orderId} has been deleted successfully`);
    } else {
      throw new Error('Failed to delete order');
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    toast.error("Failed to delete order. Please try again.");
  }
}

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
            background: linear-gradient(to right, #2563eb, #3b82f6);
            padding: 32px 40px;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content-wrapper {
            padding: 40px;
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
            padding: 20px;
            margin: 24px 0;
          }
          .order-details h3 {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
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
            padding: 24px 40px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="email-container">
            <div class="header">
              <h1>Dear ${order.first_name},</h1>
            </div>
            
            <div class="content-wrapper">
              <div class="content">
                ${formattedContent}
              </div>

              <div class="order-details">
                <h3>Order Details</h3>
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
                ` : ''}
              </div>

              <div class="signature">
                <p class="signature-name">Way of Glory Team</p>
                <p class="signature-title">Customer Success Team</p>
                <div style="margin-top: 16px;">
                  <img src="https://wayofglory.com/logo.png" alt="Way of Glory" style="height: 40px;" />
                </div>
              </div>
            </div>

            <div class="footer">
              <p>If you have any questions, please don't hesitate to contact us.</p>
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

  const getEmailTemplate = (templateId: string, order: Order): { subject: string } => {
    const template = emailTemplates.find(t => t.id === templateId);
    return template ? { subject: template.subject } : { subject: '' };
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
        order.id.toString().includes(searchLower)
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
      // Validate orderId
      if (!orderId || isNaN(orderId) || orderId <= 0) {
        throw new Error('Invalid order ID');
      }

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      try {
        // Only try to parse as JSON if the content type is application/json
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Unexpected response format: ${text}`);
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      // Update the orders list
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      toast.success(data.message || `Order #${orderId} status has been updated to ${newStatus}`);
      setIsStatusOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update order status");
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
    if (!open) {
      clearEmailState()
    }
    setIsEmailTemplatesOpen(open)
  }

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    try {
      const template = emailTemplates.find(t => t.id === templateId);
      // Clear existing content first
      clearEmailState();
      setSelectedTemplate(templateId);
      setIsTemplateLoading(true);
      setLoadingTemplateName(template?.title || 'Email Template');
      
      if (templateId === 'shipping_update') {
        setIsShippingPromptOpen(true);
        return;
      }
      
      // Only proceed if we have a template and selected order
      if (templateId && selectedOrder?.id) {
        setIsGeneratingAI(true);
        
        console.log('Generating preview for:', {
          templateId,
          orderId: selectedOrder.id,
          hasInstallation: !!selectedOrder.installation_date,
          orderStatus: selectedOrder.status
        });
        
        // Use the preview-template endpoint instead
        const response = await fetch(`/api/admin/orders/${selectedOrder.id}/preview-template?templateId=${templateId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Preview generation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            details: data.details
          });
          throw new Error(data.details || data.error || 'Failed to generate preview');
        }

        if (!data.html || !data.content) {
          console.error('Invalid preview response:', data);
          throw new Error('Preview generation returned invalid content');
        }

        // Set the preview HTML and content
        setPreviewHtml(data.html);
        setEditedContent(data.content);
        setEditedSubject(data.subject || `Order Update - Way of Glory #${selectedOrder.id}`);
        setIsAiPromptOpen(false);
        toast.success('Email preview generated successfully');
      } else {
        console.error('Missing required data:', {
          hasTemplateId: !!templateId,
          hasSelectedOrder: !!selectedOrder
        });
        toast.error('Please select an order first');
      }
    } catch (error) {
      console.error('Error in handleTemplateSelect:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview. Please try again.');
    } finally {
      setIsGeneratingAI(false);
      setIsTemplateLoading(false);
      setLoadingTemplateName('');
    }
  }

  // Handle email generation
  const handleGenerateEmail = async () => {
    try {
      if (!selectedOrder) {
        toast.error("Please select an order first");
        return;
      }
      // Just open the AI prompt dialog, don't start generation yet
      setIsAiPromptOpen(true);
      setIsGeneratingEmail(false); // Ensure we're not in loading state yet
      setIsGeneratingAI(false);
    } catch (error) {
      console.error('Error in handleGenerateEmail:', error);
      toast.error("Failed to open AI prompt");
    }
  };

  const handleAiPromptSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!selectedOrder?.id || !aiPrompt) {
        toast.error('Please provide both an order and a prompt');
        return;
      }

      // Set loading states before closing the prompt
      setIsGeneratingAI(true);
      setIsGeneratingEmail(true);
      setIsTemplateLoading(true);
      setLoadingTemplateName('Generating Custom Email...');
      
      // Close AI prompt and show email composer
      setIsAiPromptOpen(false);
      setShowEmailComposer(true);

      // Store current content for fallback
      const previousContent = content;

      // Format order items with proper price calculation
      const formattedOrderItems = selectedOrder.order_items.map(item => ({
        title: item.product?.title || 'Product',
        quantity: Number(item.quantity) || 0,
        price_at_time: Number(item.price_at_time) || 0,
        product: item.product
      }));

      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/custom-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Email generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.details || data.error || `Failed to generate email (${response.status})`);
      }

      if (!data.html || typeof data.html !== 'string') {
        console.error('Invalid response data:', { data });
        throw new Error('Server returned invalid email content');
      }

      // Add a small delay before setting content to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditedContent(data.html);
      setPreviewHtml(data.html);
      setContent(data.html);
      setEditedSubject(data.subject || `Order Update - Way of Glory #${selectedOrder.id}`);
      setSubject(data.subject || `Order Update - Way of Glory #${selectedOrder.id}`);
      setViewMode('edit');
      toast.success("Email generated successfully");
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate email");
      setViewMode('edit');
      setShowEmailComposer(true);
    } finally {
      // Add a small delay before clearing loading states
      setTimeout(() => {
        setIsGeneratingEmail(false);
        setIsGeneratingAI(false);
        setIsTemplateLoading(false);
        setLoadingTemplateName('');
      }, 500);
    }
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!selectedOrder?.id) {
      toast.error('No order selected')
      return
    }

    try {
      setIsSendingEmail(true)
      setSendingTemplateId('sending')
      
      // Use fallback values if email content or subject are missing
      const finalContent = editedContent || '<p>No email content was generated.</p>';
      const finalSubject = editedSubject || `Your Way of Glory Order #${selectedOrder.id}`;

      if(!editedContent || !editedSubject) {
        toast('Some fields were missing. Fallback values have been used.');
      }

      console.log('Email content state:', {
        hasEditedContent: !!editedContent,
        editedContentLength: editedContent?.length,
        hasEditedSubject: !!editedSubject,
        editedSubject: editedSubject,
        finalContent: finalContent?.slice(0, 100) + '...' // Log first 100 chars
      })

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
            html: finalContent
          },
          isPWA: false
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Send email failed:', {
          status: response.status,
          data: data
        })
        throw new Error(data.details || data.error || 'Failed to send email')
      }

      toast.success('Email sent successfully')
      
      // Reset all states
      clearEmailState()
      setPreviewHtml('')
      setViewMode('edit')
      setIsEmailTemplatesOpen(false)
      setTemplateVars({})
      setIsGeneratingAI(false)
      setAiPrompt('')
      setIsAiPromptOpen(false)
      setShippingStatus('')
      setIsShippingPromptOpen(false)
      
    } catch (error) {
      console.error('Error in handleSendEmail:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSendingTemplateId(null)
      setIsSendingEmail(false)
    }
  }

  // Handle quick generate
  const handleQuickGenerate = async (templateId: string) => {
    try {
      const template = emailTemplates.find(t => t.id === templateId)
      clearEmailState();
      setPreviewHtml('<p>Generating your email content...</p>');
      setIsGeneratingAI(true);
      setIsTemplateLoading(true);
      setLoadingTemplateName(template?.title || 'Email Template');

      // Check if an order is selected
      if (!selectedOrder) {
        toast.error('Please select an order first');
        return;
      }

      // Use the preview-template endpoint
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/preview-template?templateId=${templateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      // Set the email content
      setEditedContent(data.content || '');
      setPreviewHtml(data.html || '');
      setEditedSubject(data.subject || '');
      setIsAiPromptOpen(false);
      toast.success('Email preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setIsGeneratingAI(false);
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

  const handleEmailLogClick = async (log: EmailLog) => {
    setSubject(log.subject);
    setViewMode('preview');
    setIsEmailTemplatesOpen(true);
    setActiveEmailTab('content');
    
    // Use the content directly since it's already formatted
    setEditedContent(log.content);
    setPreviewHtml(log.content);
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
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2 bg-white shadow-sm border-gray-200 hover:bg-gray-50/80 transition-all"
            >
              <FileText className="h-4 w-4 text-gray-500" />
              Export Data
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Button>
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-blue-50/50 transition-all duration-200">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-600">
                        #{order.id}
                      </span>
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
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
      </div>

      {/* Order Details Dialog */}
      <Dialog 
        open={isDetailsOpen} 
        onOpenChange={(open: boolean) => setIsDetailsOpen(open)}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white p-0">
          {selectedOrder && (
            <>
              {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b">
                <div className="px-8 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                  <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
                        <Package className="h-6 w-6 text-white" />
                    </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Order #{selectedOrder.id}</h2>
                        <p className="text-gray-500 mt-1">
                          Created on {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
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
                        } text-white border-none`}
                      >
                        {selectedOrder.status}
                      </Badge>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                        className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                        <X className="h-5 w-5 text-gray-500" />
                </button>
                    </div>
              </div>

                  {/* Customer Summary */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-gray-900">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Mail className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <a 
                            href={`mailto:${selectedOrder.email}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {selectedOrder.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Phone className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <a 
                            href={`tel:${selectedOrder.phone}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {selectedOrder.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-900">${formatPrice(selectedOrder.total_amount)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-8 py-3 bg-white border-t border-gray-100 flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                    className="gap-2 bg-white hover:bg-gray-50/80"
                    onClick={() => handleResendEmail(selectedOrder.id)}
                >
                  <Mail className="h-4 w-4" />
                  Resend Order Email
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                    className="gap-2 bg-white hover:bg-gray-50/80"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setIsStatusOpen(true);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Update Status
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                    className="gap-2 bg-white hover:bg-gray-50/80"
                  onClick={() => handleEmailTemplatesOpenChange(true)}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600/30 border-t-gray-600" />
                      Sending...
                    </>
                  ) : (
                    <>
                  <FileText className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  className="gap-2 ml-auto"
                    onClick={() => handleDelete(selectedOrder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Order
                </Button>
              </div>
            </div>

              {/* Content */}
              <div className="grid grid-cols-12 gap-6 p-8 bg-gray-50">
                {/* Left Column - Customer & Order Info */}
                <div className="col-span-6 space-y-6">
                {/* Customer Information */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="bg-blue-50 p-1 rounded-md">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    Customer Information
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="text-sm font-medium text-gray-900">{selectedOrder.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="text-sm font-medium text-gray-900">{selectedOrder.phone}</div>
                    </div>
                    {selectedOrder.organization && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">Organization</div>
                          <div className="text-sm font-medium text-gray-900">{selectedOrder.organization}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="bg-blue-50 p-1 rounded-md">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                    Shipping Information
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedOrder.shipping_address}<br />
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}
                      </div>
                    </div>
                    {selectedOrder.shipping_instructions && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">Special Instructions</div>
                          <div className="text-sm font-medium text-gray-900">{selectedOrder.shipping_instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="bg-blue-50 p-1 rounded-md">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      Payment Information
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Payment Method</div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{selectedOrder.payment_method}</div>
                      </div>
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Products Subtotal</span>
                          <span className="font-medium text-gray-900">${formatPrice(selectedOrder.order_items.reduce((sum, item) => 
                            sum + (Number(item.price_at_time) * item.quantity), 0))}</span>
                        </div>
                        {Number(selectedOrder.installation_price) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Installation</span>
                            <span className="font-medium text-gray-900">${formatPrice(selectedOrder.installation_price)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tax (7.75%)</span>
                          <span className="font-medium text-gray-900">${formatPrice(calculateOrderTax(selectedOrder))}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-2 mt-2 border-t">
                          <span className="text-gray-900">Total Amount</span>
                          <span className="text-lg text-gray-900">${formatPrice(selectedOrder.total_amount)}</span>
                        </div>
                      </div>
                  </div>
                </div>
              </div>

                {/* Right Column - Installation & Order Items */}
                <div className="col-span-6 space-y-6">
                {/* Installation Details */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="bg-blue-50 p-1 rounded-md">
                        <Wrench className="h-4 w-4 text-blue-600" />
                      </div>
                    Installation Details
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Installation Address</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedOrder.installation_address}<br />
                          {selectedOrder.installation_city}, {selectedOrder.installation_state} {selectedOrder.installation_zip}
                      </div>
                    </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Installation Time</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.installation_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {selectedOrder.installation_time && ` at ${selectedOrder.installation_time}`}
                      </div>
                    </div>
                    {selectedOrder.contact_onsite && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">On-site Contact</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedOrder.contact_onsite}<br />
                            <a 
                              href={`tel:${selectedOrder.contact_onsite_phone}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {selectedOrder.contact_onsite_phone}
                            </a>
                        </div>
                      </div>
                    )}
                    {selectedOrder.access_instructions && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">Access Instructions</div>
                          <div className="text-sm font-medium text-gray-900">{selectedOrder.access_instructions}</div>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Order Items */}
                  <div className="space-y-1 flex-1">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="bg-blue-50 p-1 rounded-md">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      Order Items
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100vh-600px)] flex flex-col">
                      <div className="p-4 border-b bg-gray-50/50">
                        <div className="text-sm text-gray-500">
                          {selectedOrder.order_items.length} items in order
                    </div>
                        </div>
                      <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                    {selectedOrder.order_items.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleProductClick(item)}
                        className="w-full text-left p-4 hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-medium text-sm text-gray-900">{item.product?.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Quantity: {item.quantity} × ${formatPrice(item.price_at_time)}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${formatPrice(Number(item.price_at_time) * item.quantity)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                  </div>
                </div>
                </div>

              {/* Tabs Section */}
              <div className="px-8 pb-8">
                <Tabs defaultValue="signature" className="w-full">
                  <TabsList className="grid w-[400px] grid-cols-2 p-1 bg-gray-100/80">
                    <TabsTrigger value="signature" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg">
                      <PenTool className="h-4 w-4" />
                      Signature
                    </TabsTrigger>
                    <TabsTrigger value="email_history" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg">
                      <Mail className="h-4 w-4" />
                      Email History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signature" className="mt-6">
                {selectedOrder.signature_url && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <img 
                            src={selectedOrder.signature_url || ''} 
                          alt="Customer Signature" 
                          className="max-h-32 object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => selectedOrder.signature_url && setSelectedSignature(selectedOrder.signature_url)}
                        />
                      </div>
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Signed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                  </TabsContent>

                  <TabsContent value="email_history" className="mt-6">
                    {renderEmailHistory()}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Templates Dialog */}
      <Dialog 
        open={isEmailTemplatesOpen} 
        onOpenChange={(open: boolean) => handleEmailTemplatesOpenChange(open)}
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
                      // Set a timeout to clear the loading state
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

                <Tabs 
                  value={activeTab}
                  defaultValue="content" 
                  className="w-full" 
                  onValueChange={(value) => setActiveTab(value as EmailTabValue)}
                >
                    <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[600px] grid-cols-3 p-1 bg-gray-100/80">
                      <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg">
                          <FileText className="h-4 w-4" />
                          Content
                        </TabsTrigger>
                      <TabsTrigger value="variables" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg">
                          <Settings className="h-4 w-4" />
                          Variables
                        </TabsTrigger>
                      <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg">
                        <Clock className="h-4 w-4" />
                        History
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="content" className="mt-0">
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                      {viewMode === 'edit' ? (
                        <div className="p-6 relative">
                          {(isGeneratingAI || isTemplateLoading) && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="w-20 h-20 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]" />
                                  <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_1.5s_linear_infinite] absolute inset-0" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                      <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                                      <div className="absolute inset-0 animate-ping">
                                        <Sparkles className="h-8 w-8 text-blue-500/30" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {isTemplateLoading ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <span>Loading {loadingTemplateName}</span>
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
                            </div>
                          )}
                          <EmailComposer
                            orderId={String(selectedOrder?.id || '')}
                            initialContent={editedContent}
                            onContentChange={(content) => {
                              setEditedContent(content)
                              setPreviewHtml(content)
                            }}
                            onSubjectChange={(subject) => setEditedSubject(subject)}
                            subject={editedSubject}
                            onEmailSent={() => {
                              clearEmailState()
                            }}
                            isTemplateLoading={isTemplateLoading}
                            loadingTemplateName={loadingTemplateName}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                              const tabsElement = document.querySelector(`[role="tab"][value="${tab}"]`) as HTMLButtonElement;
                              if (tabsElement) {
                                tabsElement.click();
                              }
                            }}
                          />
                        </div>
                      ) : (
                          <EmailPreview html={previewHtml} height="600px" width="100%" />
                      )}
                    </div>
                    </TabsContent>

                    <TabsContent value="variables" className="mt-0">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <div className="grid grid-cols-2 gap-6">
                        {/* Variables Grid */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            Customer Name
                          </Label>
                            <Input
                              value={templateVars.customerName || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                customerName: e.target.value
                              }))}
                              placeholder={`${selectedOrder?.first_name} ${selectedOrder?.last_name}`}
                            className="bg-white border-gray-200"
                            />
                          </div>
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            Order Number
                          </Label>
                            <Input
                              value={templateVars.orderNumber || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                orderNumber: e.target.value
                              }))}
                              placeholder={`#${selectedOrder?.id}`}
                            className="bg-white border-gray-200"
                            />
                          </div>
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            Total Amount
                          </Label>
                            <Input
                              value={templateVars.totalAmount || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                totalAmount: e.target.value
                              }))}
                              placeholder={`$${selectedOrder?.total_amount}`}
                            className="bg-white border-gray-200"
                            />
                          </div>
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            Installation Date
                          </Label>
                            <Input
                              value={templateVars.installationDate || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                installationDate: e.target.value
                              }))}
                              placeholder={selectedOrder?.installation_date || ''}
                            className="bg-white border-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                      <div className="space-y-4">
                        {isLoadingEmailLogs ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                        ) : emailLogs.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No emails have been sent yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {emailLogs.map((log) => (
                              <div
                                key={log.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setEditedSubject(log.subject);
                                  setEditedContent(log.content);
                                  setPreviewHtml(log.content);
                                  setViewMode('preview');
                                  setActiveTab('content');
                                }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900">{log.subject}</h4>
                                  <span className="text-xs text-gray-500">{log.sent_at}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{log.preview}</p>
                                {log.template_id && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {log.template_id.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t z-50">
                  <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-end gap-4">
                  <Button
                      variant="ghost"
                    onClick={() => {
                      setIsEmailTemplatesOpen(false)
                    }}
                      className="w-[200px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-gray-900 font-medium"
                  >
                    Cancel
                  </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={isLoading || isGeneratingAI || isTemplateLoading}
                      className="w-[200px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Dialog */}
      <Dialog open={isAiPromptOpen} onOpenChange={setIsAiPromptOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white !p-0">
          <div className="bg-white rounded-lg">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Generate Custom Email
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 px-6 py-4">
              <div className="space-y-2">
                <Label>What kind of email would you like to generate?</Label>
                {isGeneratingAI ? (
                  <div className="h-32 bg-white border rounded-lg p-4 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-100 animate-[spin_3s_linear_infinite]" />
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-[spin_1.5s_linear_infinite] absolute inset-0" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          <div className="flex flex-col items-center gap-1">
                            <span>Generating Email</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite]" />
                              <div className="w-1 h-1 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.2s]" />
                              <div className="w-1 h-1 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.4s]" />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Example: Write a follow-up email asking about their experience with the installation. Make it friendly but professional."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="h-32 resize-none bg-white"
                  />
                )}
              </div>
            </div>
            <DialogFooter className="px-6 pb-6">
              <Button
                onClick={() => setIsAiPromptOpen(false)}
                variant="ghost"
                className="text-gray-600"
                disabled={isGeneratingAI}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAiPromptSubmit}
                disabled={isGeneratingAI}
                className={`bg-blue-600 hover:bg-blue-700 text-white ${isGeneratingAI ? 'min-w-[100px]' : ''}`}
              >
                {isGeneratingAI ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipping Status Dialog */}
      <Dialog 
        open={isShippingPromptOpen} 
        onOpenChange={(open: boolean) => setIsShippingPromptOpen(open)}
      >
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5 text-blue-500" />
              Select Current Order Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isGeneratingAI && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="text-sm text-gray-600">Generating email...</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {['Processing', 'Shipped', 'Out for Delivery', 'Delayed'].map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className="w-full justify-start gap-3 py-6 text-left"
                  onClick={() => handleShippingUpdate(status)}
                  disabled={isGeneratingAI}
                >
                  <div className="flex items-center gap-3">
                    {status === 'Processing' && <Package className="h-5 w-5 text-blue-500" />}
                    {status === 'Shipped' && <Truck className="h-5 w-5 text-green-500" />}
                    {status === 'Out for Delivery' && <MapPin className="h-5 w-5 text-purple-500" />}
                    {status === 'Delayed' && <Clock className="h-5 w-5 text-orange-500" />}
                    <div>
                      <div className="font-medium">{status}</div>
                      <div className="text-sm text-gray-500">
                        Select to update customer about this status
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog 
        open={isProductDetailsOpen} 
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsProductDetailsOpen(false)
            setIsFullScreen(false)
          }
        }}
      >
        <DialogContent className={`bg-white p-0 rounded-2xl shadow-xl transition-all duration-200 overflow-hidden ${
          isFullScreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-3xl max-h-[85vh]'
        }`}>
          <DialogHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">Product Details</DialogTitle>
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
                      setIsProductDetailsOpen(false)
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
          <div className={`overflow-y-auto ${isFullScreen ? 'h-[calc(95vh-88px)]' : 'h-[calc(85vh-88px)]'}`}>
            <ProductDetails product={selectedProduct} isFullScreen={isFullScreen} />
          </div>
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

      {showEmailComposer && selectedOrder && (
        <EmailComposer
          orderId={selectedOrder.id.toString()}
          onEmailSent={handleEmailSent}
          initialContent={content}
          onContentChange={setContent}
          subject={subject}
          onSubjectChange={setSubject}
          onClose={handleCloseEmailComposer}
          isTemplateLoading={isGeneratingEmail || viewMode === 'loading'}
          loadingTemplateName={loadingTemplateName}
          activeTab={activeEmailTab}
          onTabChange={handleEmailTabChange}
          isSending={isSendingEmail}
        />
      )}
    </div>
  ) // End of return
} // End of OrdersPage