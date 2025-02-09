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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailComposer from '@/components/admin/EmailComposer'
import { type DialogProps } from "@radix-ui/react-dialog"
import { FC } from "react"
import EmailPreview from '../../../components/email-preview'

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
  return numericPrice.toFixed(2)
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({})
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false)
  const [shippingStatus, setShippingStatus] = useState('')
  const [isShippingPromptOpen, setIsShippingPromptOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

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
      // Clear existing content first
      clearEmailState()
      setSelectedTemplate(templateId)
      
      if (templateId === 'shipping_update') {
        setIsShippingPromptOpen(true)
        return
      }
      
      // Only proceed if we have a template and selected order
      if (templateId && selectedOrder?.id) {
        setIsGeneratingAI(true)
        
        console.log('Generating preview for:', {
          templateId,
          orderId: selectedOrder.id,
          hasInstallation: !!selectedOrder.installation_date,
          orderStatus: selectedOrder.status
        })
        
        // Use the preview-template endpoint instead
        const response = await fetch(`/api/admin/orders/${selectedOrder.id}/preview-template?templateId=${templateId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        const data = await response.json()
        
        if (!response.ok) {
          console.error('Preview generation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            details: data.details
          })
          throw new Error(data.details || data.error || 'Failed to generate preview')
        }

        if (!data.html || !data.content) {
          console.error('Invalid preview response:', data)
          throw new Error('Preview generation returned invalid content')
        }

        // Set the preview HTML and content
        setPreviewHtml(data.html)
        setEditedContent(data.content)
        setEditedSubject(data.subject || `Order Update - Way of Glory #${selectedOrder.id}`)
        setIsAiPromptOpen(false)
        toast.success('Email preview generated successfully')
      } else {
        console.error('Missing required data:', {
          hasTemplateId: !!templateId,
          hasSelectedOrder: !!selectedOrder
        })
        toast.error('Please select an order first')
      }
    } catch (error) {
      console.error('Error in handleTemplateSelect:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Handle email generation
  const handleGenerateEmail = async () => {
    try {
      // Clear existing content first
      clearEmailState()
      setIsGeneratingAI(true)
      
      console.log('Starting email generation with prompt:', aiPrompt)

      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          templateType: selectedTemplate || 'custom',
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

      console.log('Generation response:', {
        hasHtml: !!data.html,
        htmlLength: data.html?.length,
        hasSubject: !!data.subject,
        subject: data.subject,
        rawResponse: data
      })

      // Store the raw AI-generated content
      setEditedContent(data.html || '')
      setPreviewHtml(data.html || '')
      if (!data.subject) {
        if (selectedTemplate && selectedTemplate !== 'custom' && selectedOrder) {
          const template = getEmailTemplate(selectedTemplate, selectedOrder);
          setEditedSubject(template.subject);
        } else {
          setEditedSubject('Your Way of Glory Order');
        }
      } else {
        setEditedSubject(data.subject);
      }
      setIsAiPromptOpen(false)
      toast.success('Email content generated successfully')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate content. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Handle sending email
  const handleSendEmail = async () => {
    if (!selectedOrder?.id) {
      toast.error('No order selected')
      return
    }

    try {
      setSendingTemplateId('sending')
      
      // Use fallback values if email content or subject are missing
      const finalContent = editedContent && editedContent.trim() !== '' ? editedContent : '<p>No email content was generated.</p>';
      const finalSubject = editedSubject && editedSubject.trim() !== '' ? editedSubject : `Your Way of Glory Order #${selectedOrder.id}`;

      if(editedContent !== finalContent || editedSubject !== finalSubject) {
        toast('Some fields were missing. Fallback values have been used.');
      }

      // Use final values for sending
      const emailContent = finalContent;
      const emailSubject = finalSubject;

      console.log('Email content state:', {
        hasEditedContent: !!editedContent,
        editedContentLength: editedContent?.length,
        hasEditedSubject: !!editedSubject,
        editedSubject: editedSubject,
        emailContent: emailContent?.slice(0, 100) + '...' // Log first 100 chars
      })

      if (!emailContent || !emailSubject) {
        console.error('Missing required fields:', {
          hasContent: !!emailContent,
          hasSubject: !!emailSubject
        })
        throw new Error('Missing email content or subject')
      }

      console.log('Sending email with:', {
        orderId: selectedOrder.id,
        hasContent: !!emailContent,
        contentLength: emailContent?.length,
        subject: emailSubject
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
            subject: emailSubject,
            html: emailContent
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
      setEditedContent('')
      setEditedSubject('')
      setSelectedTemplate(null)
      setIsEmailTemplatesOpen(false)
    } catch (error) {
      console.error('Error in handleSendEmail:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSendingTemplateId(null)
    }
  }

  // Handle quick generate
  const handleQuickGenerate = async (templateId: string) => {
    try {
      clearEmailState();
      setPreviewHtml('<p>Generating your email content...</p>');
      setIsGeneratingAI(true);

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
    
    return (
      <div className={`divide-y ${isFullScreen ? 'h-full' : ''}`}>
        {/* Product Header Section */}
        <div className={`p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 ${
          isFullScreen ? 'sticky top-0 z-10 border-b' : ''
        }`}>
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-semibold text-gray-900">{product.product.title}</h2>
                {product.product.is_service ? (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Service</Badge>
                ) : (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{product.product.category}</Badge>
                )}
              </div>
              <p className="text-gray-600 text-base leading-relaxed">{product.product.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${Number(product.price_at_time).toFixed(2)}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <Badge variant="outline" className="text-base bg-white">
                  Quantity: {product.quantity}
                </Badge>
                <Badge variant="outline" className="text-base bg-white">
                  Total: ${(Number(product.price_at_time) * product.quantity).toFixed(2)}
                </Badge>
              </div>
              {!product.product.is_service && (
                <div className="text-sm text-gray-500 mt-2">
                  + ${(Number(product.price_at_time) * product.quantity * 0.0775).toFixed(2)} tax
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
              <div className="text-gray-900 font-medium">${Number(product.price_at_time).toFixed(2)}</div>
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
              <div className="text-gray-900 font-medium">${(Number(product.price_at_time) * product.quantity).toFixed(2)}</div>
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

  return (
    <div className="max-w-[1600px] mx-auto p-8 space-y-8">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Sales & Orders
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Track and manage your sales, orders, and installations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 hover:bg-gray-100 transition-colors">
              <FileText className="h-4 w-4" />
              Export Orders
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Orders Stats */}
        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200">
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
        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200">
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
        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200">
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
        <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200">
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
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <Select 
              value={statusFilter} 
              onValueChange={(value: OrderStatus) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
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
              <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
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
              <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
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
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-200/50">
                <th className="text-left p-4 text-sm font-medium text-gray-600">Order Details</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-blue-50/5 transition-all duration-200">
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
                          <span className="hover:text-gray-900 transition-colors">{order.email}</span>
                        </div>
                        {order.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="hover:text-gray-900 transition-colors">{order.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      {isServiceOnlyOrder(order) ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block w-fit mt-1">
                          No Tax (Service)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600 mt-1">
                          Includes ${calculateOrderTax(order).toFixed(2)} tax
                        </span>
                      )}
                      {Number(order.installation_price) > 0 && (
                        <span className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Installation: ${Number(order.installation_price).toFixed(2)}
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
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
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

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <PackageSearch className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Orders will appear here when customers place them'}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog 
        open={isDetailsOpen} 
        onOpenChange={(open: boolean) => setIsDetailsOpen(open)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl shadow-xl border-0">
          <DialogHeader>
            <div className="sticky top-0 z-50 bg-white border-b">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <DialogTitle className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#</span>
                      <span className="text-xl font-bold">{selectedOrder?.id}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{selectedOrder?.first_name} {selectedOrder?.last_name}</span>
                    </div>
                    {selectedOrder && (
                      <Badge
                        variant={getStatusVariant(selectedOrder.status)}
                        className="capitalize ml-2"
                      >
                        {selectedOrder.status}
                      </Badge>
                    )}
                  </DialogTitle>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Quick Actions Bar */}
              <div className="px-6 pb-4 flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 hover:bg-gray-50"
                  onClick={() => handleResendEmail(selectedOrder?.id || 0)}
                >
                  <Mail className="h-4 w-4" />
                  Resend Order Email
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-gray-50"
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
                  className="gap-2 hover:bg-gray-50"
                  onClick={() => handleEmailTemplatesOpenChange(true)}
                >
                  <FileText className="h-4 w-4" />
                  Send Email Template
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  className="gap-2 ml-auto"
                  onClick={() => handleDelete(selectedOrder?.id || 0)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Order
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-gray-50/50">
              {/* Left Column - Customer & Shipping */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                    <User className="h-4 w-4 text-blue-500" />
                    Customer Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600 break-all">{selectedOrder.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{selectedOrder.phone}</p>
                      </div>
                    </div>
                    {selectedOrder.organization && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">Organization</p>
                          <p className="text-sm text-gray-600">{selectedOrder.organization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                    <Truck className="h-4 w-4 text-green-500" />
                    Shipping Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Shipping Address</p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shipping_address}<br />
                          {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.shipping_instructions && (
                      <div className="flex items-start gap-3">
                        <Info className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">Special Instructions</p>
                          <p className="text-sm text-gray-600">{selectedOrder.shipping_instructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column - Installation & Payment */}
              <div className="space-y-6">
                {/* Installation Details */}
                <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                    <Wrench className="h-4 w-4 text-orange-500" />
                    Installation Details
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Installation Address</p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.installation_address}<br />
                          {selectedOrder.installation_city}, {selectedOrder.installation_state} {selectedOrder.installation_zip}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Installation Time</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedOrder.installation_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {selectedOrder.installation_time && ` at ${selectedOrder.installation_time}`}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.contact_onsite && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">On-site Contact</p>
                          <p className="text-sm text-gray-600">
                            {selectedOrder.contact_onsite} ({selectedOrder.contact_onsite_phone})
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.access_instructions && (
                      <div className="flex items-start gap-3">
                        <Info className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">Access Instructions</p>
                          <p className="text-sm text-gray-600">{selectedOrder.access_instructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    Payment Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">Payment Method</p>
                        <p className="text-sm text-gray-600 capitalize">{selectedOrder.payment_method}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Products Subtotal</span>
                          <span className="font-medium text-gray-900">
                            ${(selectedOrder.order_items.reduce((sum, item) => 
                              sum + (Number(item.price_at_time) * item.quantity), 0)).toFixed(2)}
                          </span>
                        </div>
                        {Number(selectedOrder.installation_price || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Installation</span>
                            <span className="font-medium text-gray-900">
                              ${Number(selectedOrder.installation_price || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sales Tax (7.75%)</span>
                          <span className="font-medium text-purple-600">
                            ${calculateOrderTax(selectedOrder).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 mt-2 border-t border-gray-100">
                          <span className="text-gray-900">Total Amount</span>
                          <span className="text-lg text-gray-900">
                            ${Number(selectedOrder.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Items & Signature */}
              <div className="space-y-6">
                {/* Order Items */}
                <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                    <Package className="h-4 w-4 text-blue-500" />
                    Order Items
                  </h4>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedOrder.order_items.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleProductClick(item)}
                        className="group flex items-start p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/5 transition-all cursor-pointer relative"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex flex-col gap-2 mb-2">
                            <span className="text-base font-medium text-gray-900">
                              {item.product?.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.product?.is_service ? (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                                  Service
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                                  {item.product?.category || 'Product'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              x{item.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${Number(item.price_at_time).toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Total: ${(Number(item.price_at_time) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signature Section */}
                {selectedOrder.signature_url && (
                  <div className="bg-white rounded-xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                      <PenTool className="h-4 w-4 text-gray-500" />
                      Customer Signature
                    </h4>
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 w-full">
                        <img 
                          src={selectedOrder.signature_url} 
                          alt="Customer Signature" 
                          className="max-h-32 object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedSignature(selectedOrder.signature_url)}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Signed electronically on {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Templates Dialog */}
      <Dialog 
        open={isEmailTemplatesOpen} 
        onOpenChange={(open: boolean) => handleEmailTemplatesOpenChange(open)}
      >
        <DialogContent className="max-w-7xl h-[90vh] bg-white p-0 gap-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{selectedTemplate ? emailTemplates.find(t => t.id === selectedTemplate)?.title : 'Email Templates'}</span>
              </div>
              {selectedTemplate && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${viewMode === 'edit' ? 'bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => setViewMode('edit')}
                  >
                    <Code className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${viewMode === 'preview' ? 'bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => setViewMode('preview')}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[calc(90vh-80px)]">
            <div className="w-80 border-r overflow-y-auto p-4 bg-gray-50">
              <div className="mb-4">
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    clearEmailState()
                    setSelectedTemplate(null);
                    setPreviewHtml('');
                    setEditedSubject('');
                    setTemplateVars({});
                    setViewMode('edit');
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create New Email
                </Button>
              </div>
              
              <div className="space-y-1 mb-4">
                <h4 className="text-sm font-medium text-gray-500 px-4">Email Templates</h4>
              </div>

              <div className="space-y-3">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${
                      selectedTemplate === template.id 
                        ? 'border-blue-500 bg-white shadow-sm' 
                        : 'border-transparent hover:border-gray-200 hover:bg-white'
                    } transition-all cursor-pointer relative group`}
                    onClick={() => !sendingTemplateId && handleTemplateSelect(template.id)}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedTemplate === template.id ? 'bg-blue-50' : 'bg-gray-100'
                    }`}>
                      {sendingTemplateId === template.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      ) : (
                        <template.icon className={`h-5 w-5 ${
                          selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{template.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email Subject</Label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <Tabs defaultValue="content" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="content" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Content
                        </TabsTrigger>
                        <TabsTrigger value="variables" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Variables
                        </TabsTrigger>
                      </TabsList>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        onClick={() => setIsAiPromptOpen(true)}
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>

                    <TabsContent value="content" className="mt-0">
                      {viewMode === 'edit' ? (
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
                        />
                      ) : (
                        <EmailPreview html={previewHtml} height="600px" width="100%" />
                      )}
                    </TabsContent>

                    <TabsContent value="variables" className="mt-0">
                      <div className="bg-white border rounded-lg p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Customer Name</Label>
                            <Input
                              value={templateVars.customerName || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                customerName: e.target.value
                              }))}
                              placeholder={`${selectedOrder?.first_name} ${selectedOrder?.last_name}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Order Number</Label>
                            <Input
                              value={templateVars.orderNumber || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                orderNumber: e.target.value
                              }))}
                              placeholder={`#${selectedOrder?.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Total Amount</Label>
                            <Input
                              value={templateVars.totalAmount || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                totalAmount: e.target.value
                              }))}
                              placeholder={`$${selectedOrder?.total_amount}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Installation Date</Label>
                            <Input
                              value={templateVars.installationDate || ''}
                              onChange={(e) => setTemplateVars(prev => ({
                                ...prev,
                                installationDate: e.target.value
                              }))}
                              placeholder={selectedOrder?.installation_date || ''}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex items-center gap-4 p-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearEmailState()
                      setIsEmailTemplatesOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleGenerateEmail}
                    disabled={!aiPrompt.trim() || isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Email
                      </>
                    )}
                  </Button>
                  {previewHtml && (
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleSendEmail}
                      disabled={sendingTemplateId === 'sending'}
                    >
                      {sendingTemplateId === 'sending' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Dialog */}
      <Dialog 
        open={isAiPromptOpen} 
        onOpenChange={(open: boolean) => setIsAiPromptOpen(open)}
      >
        <DialogContent className="sm:max-w-[800px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Generate Email Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-[400px] grid-cols-2 mb-6">
                <TabsTrigger value="quick" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Sparkles className="h-4 w-4" />
                  Quick Generate
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <PenTool className="h-4 w-4" />
                  Custom Write
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {emailTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors bg-white text-gray-700"
                      onClick={() => {
                        setAiPrompt(template.description)
                        handleQuickGenerate(template.id)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <template.icon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{template.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 text-left">{template.description}</p>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-0 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">What would you like to say?</Label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe what you want to communicate to the customer..."
                      className="w-full h-32 p-4 text-sm rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="font-medium">Available Variables:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>{'{{customerName}}'} - Full name of the customer</li>
                          <li>{'{{orderNumber}}'} - Order reference number</li>
                          <li>{'{{amount}}'} - Total order amount</li>
                          <li>{'{{installationDate}}'} - Scheduled installation date</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAiPromptOpen(false)}
              className="text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleGenerateEmail}
              disabled={!aiPrompt.trim() || isGeneratingAI}
            >
              {isGeneratingAI ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Email
                </>
              )}
            </Button>
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
          <DialogHeader>
            <div className="sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center justify-between p-6">
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
          <DialogHeader>
            <div className="sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center justify-between p-6">
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
    </div>
  )
} 