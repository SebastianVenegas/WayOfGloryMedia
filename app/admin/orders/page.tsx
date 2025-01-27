'use client'

import { useState, useEffect } from 'react'
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

interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price_at_time: number | string
  cost_at_time: number | string
  product?: {
    title: string
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
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

const calculateOrderTax = (order: Order): number => {
  // Only calculate tax on products, not installation or services
  return order.order_items.reduce((totalTax, item) => {
    const itemPrice = typeof item.price_at_time === 'string' ? parseFloat(item.price_at_time) : item.price_at_time
    return totalTax + (itemPrice * item.quantity * TAX_RATE)
  }, 0)
}

const calculateOrderTotalWithTax = (order: Order): number => {
  const subtotal = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount
  const installationPrice = order.installation_price ? 
    (typeof order.installation_price === 'string' ? parseFloat(order.installation_price) : order.installation_price) 
    : 0
  const productsTax = calculateOrderTax(order)
  
  return subtotal + productsTax
}

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
    default:
      return 'default'
  }
}

// Update type definitions
type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'all';
type OrderStatusUpdate = 'pending' | 'confirmed' | 'completed' | 'cancelled';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

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

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchTerm, statusFilter, dateFilter, sortOrder])

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

  const filterAndSortOrders = () => {
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
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
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
      totalAmount: orders.reduce((sum, order) => {
        const amount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : order.total_amount
        return sum + amount
      }, 0),
      totalTax: orders.reduce((sum, order) => sum + calculateOrderTax(order), 0),
      totalWithTax: orders.reduce((sum, order) => {
        const withTax = calculateOrderTotalWithTax(order)
        return sum + withTax
      }, 0),
      totalProfit: orders.reduce((sum, order) => {
        // Get the subtotal of products only (before tax)
        const productSubtotal = order.order_items.reduce((itemSum, item) => {
          const price = typeof item.price_at_time === 'string' 
            ? parseFloat(item.price_at_time) 
            : item.price_at_time;
          return itemSum + (price * item.quantity);
        }, 0);

        // Get installation price (100% of this is profit)
        const installationPrice = order.installation_price
          ? (typeof order.installation_price === 'string' 
            ? parseFloat(order.installation_price) 
            : order.installation_price)
          : 0;

        // For products with 20% markup, profit is (selling price - cost)
        // If selling price is S, then cost is S/1.2
        // So profit = S - (S/1.2) = S * (1 - 1/1.2) = S * 0.1667
        const productProfit = productSubtotal * 0.1667;
        
        // Total profit is product profit plus 100% of installation
        const orderProfit = productProfit + installationPrice;
        
        return sum + orderProfit;
      }, 0),
      totalCost: orders.reduce((sum, order) => {
        const cost = typeof order.total_cost === 'string'
          ? parseFloat(order.total_cost)
          : order.total_cost || 0
        return sum + cost
      }, 0),
    }
    return stats
  }

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatusUpdate) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the orders list
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));

        toast.success(`Order #${orderId} status has been updated to ${newStatus}`);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status. Please try again.");
    }
  };

  const handleDelete = (orderId: number) => {
    handleDeleteOrder(orderId, orders, setOrders);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const stats = getOrderStatistics()

  return (
    <>
      <Dialog open={!!selectedSignature} onOpenChange={() => setSelectedSignature(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Customer Signature</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8 bg-white rounded-lg">
            {selectedSignature && (
              <img 
                src={selectedSignature} 
                alt="Customer Signature" 
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
        <div className="max-w-[2000px] mx-auto p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Sales & Orders
                </h1>
                <p className="mt-2 text-gray-600">
                  Track and manage your sales, orders, and installations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export Orders
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Orders Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Revenue</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalWithTax.toFixed(2)}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-2xl font-bold text-green-600">${stats.totalProfit.toFixed(2)}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ 
                        width: `${(stats.totalProfit / stats.totalWithTax * 100).toFixed(0)}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
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
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <Select 
                  value={dateFilter} 
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select 
                  value={sortOrder} 
                  onValueChange={(value: SortOrder) => setSortOrder(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort orders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Amount</SelectItem>
                    <SelectItem value="lowest">Lowest Amount</SelectItem>
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
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Order Details</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            #{order.id}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {order.first_name} {order.last_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {order.email}
                          </span>
                          {order.phone && (
                            <span className="text-sm text-gray-500">
                              {order.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            ${(Number(order.total_amount) + calculateOrderTax(order)).toFixed(2)}
                          </span>
                          {Number(order.installation_price) > 0 && (
                            <span className="text-xs text-gray-600">
                              Includes ${Number(order.installation_price).toFixed(2)} installation
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'default'
                              : order.status === 'pending'
                              ? 'secondary'
                              : order.status === 'confirmed'
                              ? 'default'
                              : 'destructive'
                          }
                          className="capitalize font-medium"
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 hover:bg-gray-100"
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
                              className="gap-1 hover:bg-gray-100"
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
                            className="gap-1 hover:bg-gray-100"
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
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0">
          <button
            onClick={() => setIsDetailsOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white border border-gray-200 shadow-sm p-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10 shadow-sm">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">#</span>
                <span className="font-bold">{selectedOrder?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>{selectedOrder?.first_name} {selectedOrder?.last_name}</span>
              </div>
              {selectedOrder && (
                <Badge
                  variant={getStatusVariant(selectedOrder.status)}
                  className="capitalize ml-auto"
                >
                  {selectedOrder.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-white relative">
              {/* Customer Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 break-all">{selectedOrder.email}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600">{selectedOrder.phone}</span>
                    </p>
                    {selectedOrder.organization && (
                      <p className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-600">{selectedOrder.organization}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Truck className="h-4 w-4" />
                    Shipping Information
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {selectedOrder.shipping_address}<br />
                        {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}
                      </span>
                    </p>
                    {selectedOrder.shipping_instructions && (
                      <div className="border-t border-gray-200 pt-2">
                        <p className="text-sm text-gray-900 font-medium mb-1">Instructions:</p>
                        <p className="text-sm text-gray-600">{selectedOrder.shipping_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Installation & Payment */}
              <div className="space-y-6">
                {/* Installation Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Wrench className="h-4 w-4" />
                    Installation Details
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {selectedOrder.installation_address}<br />
                        {selectedOrder.installation_city}, {selectedOrder.installation_state} {selectedOrder.installation_zip}
                      </span>
                    </p>
                    <div className="border-t border-gray-200 pt-2 space-y-3">
                      <p className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-600">
                          {new Date(selectedOrder.installation_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {selectedOrder.installation_time && ` at ${selectedOrder.installation_time}`}
                        </span>
                      </p>
                      {selectedOrder.contact_onsite && (
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-gray-600">
                            Contact: {selectedOrder.contact_onsite} ({selectedOrder.contact_onsite_phone})
                          </span>
                        </p>
                      )}
                      {selectedOrder.access_instructions && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-900 font-medium mb-1">Access Instructions:</p>
                          <p className="text-sm text-gray-600">{selectedOrder.access_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600">
                        Method: <span className="capitalize">{selectedOrder.payment_method}</span>
                      </span>
                    </p>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Products Subtotal</span>
                          <span className="font-medium">
                            ${(selectedOrder.order_items.reduce((sum, item) => 
                              sum + (Number(item.price_at_time) * item.quantity), 0)).toFixed(2)}
                          </span>
                        </div>
                        {Number(selectedOrder.installation_price || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Installation</span>
                            <span className="font-medium">
                              ${Number(selectedOrder.installation_price || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sales Tax</span>
                          <span className="font-medium text-purple-600">
                            ${calculateOrderTax(selectedOrder).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                          <span className="text-gray-900">Total</span>
                          <span className="text-lg text-gray-900">
                            ${(Number(selectedOrder.total_amount) + calculateOrderTax(selectedOrder)).toFixed(2)}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Product Profit (20% markup)</span>
                              <span className="font-medium text-green-600">
                                ${(selectedOrder.order_items.reduce((sum, item) => 
                                  sum + (Number(item.price_at_time) * item.quantity), 0) / 6).toFixed(2)}
                              </span>
                            </div>
                            {Number(selectedOrder.installation_price || 0) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Installation Profit (100%)</span>
                                <span className="font-medium text-green-600">
                                  ${Number(selectedOrder.installation_price || 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                              <span className="text-gray-900">Total Profit</span>
                              <span className="text-lg text-green-600">
                                ${(
                                  (selectedOrder.order_items.reduce((sum, item) => 
                                    sum + (Number(item.price_at_time) * item.quantity), 0) / 6) +
                                  Number(selectedOrder.installation_price || 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Package className="h-4 w-4" />
                    Order Items
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedOrder.order_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm py-2 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.product?.title}</span>
                          <Badge variant="secondary" className="bg-gray-100">
                            x{item.quantity}
                          </Badge>
                        </div>
                        <span className="text-gray-600">${Number(item.price_at_time).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    Actions
                  </h4>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 bg-white hover:bg-gray-100"
                      onClick={() => handleResendEmail(selectedOrder.id)}
                    >
                      <Mail className="h-4 w-4" />
                      Resend Order Email
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 bg-white hover:bg-gray-100"
                      onClick={() => {
                        setIsDetailsOpen(false);
                        setIsStatusOpen(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Update Status
                    </Button>
                    {selectedOrder.signature_url && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 bg-white hover:bg-gray-100"
                        onClick={() => {
                          setIsDetailsOpen(false);
                          setSelectedSignature(selectedOrder.signature_url);
                        }}
                      >
                        <PenTool className="h-4 w-4" />
                        View Signature
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge
                  variant={getStatusVariant(selectedOrder.status)}
                  className="capitalize"
                >
                  {selectedOrder.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value: OrderStatusUpdate) => {
                    updateOrderStatus(selectedOrder.id, value);
                    setIsStatusOpen(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 