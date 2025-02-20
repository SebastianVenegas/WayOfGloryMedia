'use client'

import { useState, useEffect } from 'react'
import { 
  Headphones, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Loader2,
  MoreHorizontal,
  User,
  WrenchIcon,
  Plus,
  FileText,
  Settings,
  Mic2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { toast } from "@/components/ui/use-toast"

interface Order {
  id: number
  customer_name: string
  email: string
  total: number
  status: string
  created_at: string
  items: Array<{
    title: string
    price: number
    quantity: number
    is_service: boolean
  }>
}

interface Stats {
  revenue: {
    total: number
    previousPeriod: number
    products: number
    services: number
    installation: number
  }
  orders: {
    total: number
    previousPeriod: number
  }
  services: {
    active: number
    previousPeriod: number
  }
  customers: {
    active: number
    previousPeriod: number
  }
}

const defaultStats: Stats = {
  revenue: {
    total: 0,
    previousPeriod: 0,
    products: 0,
    services: 0,
    installation: 0
  },
  orders: {
    total: 0,
    previousPeriod: 0
  },
  services: {
    active: 0,
    previousPeriod: 0
  },
  customers: {
    active: 0,
    previousPeriod: 0
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Get user name from localStorage
    const name = localStorage.getItem('admin_name')
    if (name) {
      setUserName(name)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [ordersRes, statsRes] = await Promise.all([
          fetch(`/api/orders?period=${selectedPeriod}`),
          fetch(`/api/stats?period=${selectedPeriod}`)
        ]);

        // Log responses for debugging
        console.log('Orders Response:', {
          status: ordersRes.status,
          statusText: ordersRes.statusText,
          headers: Object.fromEntries(ordersRes.headers.entries())
        });
        console.log('Stats Response:', {
          status: statsRes.status,
          statusText: statsRes.statusText,
          headers: Object.fromEntries(statsRes.headers.entries())
        });

        if (!ordersRes.ok || !statsRes.ok) {
          // Get the error text from both responses
          const [ordersText, statsText] = await Promise.all([
            ordersRes.text(),
            statsRes.text()
          ]);

          console.error('Orders Error:', ordersText);
          console.error('Stats Error:', statsText);

          throw new Error(
            `Failed to fetch data. Orders: ${ordersRes.status} ${ordersRes.statusText}, Stats: ${statsRes.status} ${statsRes.statusText}`
          );
        }

        // Try to parse JSON responses
        let ordersData, statsData;
        try {
          ordersData = await ordersRes.json();
        } catch (e) {
          const text = await ordersRes.text();
          console.error('Orders JSON Parse Error:', e);
          console.error('Orders Raw Response:', text);
          throw new Error('Failed to parse orders response');
        }

        try {
          statsData = await statsRes.json();
        } catch (e) {
          const text = await statsRes.text();
          console.error('Stats JSON Parse Error:', e);
          console.error('Stats Raw Response:', text);
          throw new Error('Failed to parse stats response');
        }

        // Validate response data structure
        if (!Array.isArray(ordersData)) {
          console.error('Invalid orders data format:', ordersData);
          throw new Error('Invalid orders data format');
        }

        if (!statsData || typeof statsData !== 'object') {
          console.error('Invalid stats data format:', statsData);
          throw new Error('Invalid stats data format');
        }

        setOrders(ordersData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(dateString))
  }

  const handleOrderClick = (orderId: number) => {
    router.push('/admin/orders')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openOrderDetails', { 
        detail: { orderId } 
      }))
    }, 100)
  }

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders');
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      // Try to parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error('Failed to parse server response');
      }

      // Validate the response data
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setOrders(data);
      return response; // Return the response for Promise.all
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch orders",
        variant: "destructive",
      });
      throw error; // Re-throw the error for Promise.all
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="p-4 bg-red-50 rounded-xl text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500 animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const revenueGrowth = calculateGrowth(stats.revenue.total, stats.revenue.previousPeriod)
  const ordersGrowth = calculateGrowth(stats.orders.total, stats.orders.previousPeriod)
  const servicesGrowth = calculateGrowth(stats.services.active, stats.services.previousPeriod)
  const customersGrowth = calculateGrowth(stats.customers.active, stats.customers.previousPeriod)

  return (
    <div className="space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 md:p-8 rounded-3xl shadow-lg">
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10" />
        <div className="relative space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="mt-2 text-blue-100 text-sm md:text-base">
              Here's what's happening with your business today
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 group"
          onClick={() => window.location.href = '/admin/products'}
        >
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">New Order</span>
          <span className="text-xs text-gray-500 text-center">Create a new customer order</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 group"
          onClick={() => window.location.href = '/admin/orders'}
        >
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium">View Orders</span>
          <span className="text-xs text-gray-500 text-center">Manage customer orders</span>
        </Button>
      </div>

      {/* Time Period Selector with mobile responsiveness */}
      <Tabs defaultValue={selectedPeriod} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white border shadow-sm rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="1d" 
              onClick={() => setSelectedPeriod('1d')}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 flex-1 md:flex-none whitespace-nowrap"
            >
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="7d" 
              onClick={() => setSelectedPeriod('7d')}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 flex-1 md:flex-none whitespace-nowrap"
            >
              7 Days
            </TabsTrigger>
            <TabsTrigger 
              value="30d" 
              onClick={() => setSelectedPeriod('30d')}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 flex-1 md:flex-none whitespace-nowrap"
            >
              30 Days
            </TabsTrigger>
            <TabsTrigger 
              value="90d" 
              onClick={() => setSelectedPeriod('90d')}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 flex-1 md:flex-none whitespace-nowrap"
            >
              90 Days
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Overview Cards with mobile responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Revenue Card */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.revenue.total)}
                  </div>
                  <div className={cn(
                    "flex items-center text-sm font-medium px-2 py-0.5 rounded-full",
                    revenueGrowth > 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                  )}>
                    {revenueGrowth > 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  vs. previous period
                </p>
                <div className="mt-4 h-[60px] text-blue-200">
                  <BarChart3 className="h-full w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Orders Card */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  New Orders
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-200">
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-gray-900">
                    +{stats.orders.total}
                  </div>
                  <div className={cn(
                    "flex items-center text-sm font-medium px-2 py-0.5 rounded-full",
                    ordersGrowth > 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                  )}>
                    {ordersGrowth > 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(ordersGrowth).toFixed(1)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  vs. previous period
                </p>
                <div className="mt-4 h-[60px] text-emerald-200">
                  <Activity className="h-full w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Services Card */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Services
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors duration-200">
                  <Headphones className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.services.active}
                  </div>
                  <div className={cn(
                    "flex items-center text-sm font-medium px-2 py-0.5 rounded-full",
                    servicesGrowth > 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                  )}>
                    {servicesGrowth > 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(servicesGrowth).toFixed(1)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  vs. previous period
                </p>
                <div className="mt-4 h-[60px] text-purple-200">
                  <TrendingUp className="h-full w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Customers Card */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Customers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors duration-200">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.customers.active}
                  </div>
                  <div className={cn(
                    "flex items-center text-sm font-medium px-2 py-0.5 rounded-full",
                    customersGrowth > 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                  )}>
                    {customersGrowth > 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(customersGrowth).toFixed(1)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  vs. previous period
                </p>
                <div className="mt-4 h-[60px] text-orange-200">
                  <TrendingUp className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid with enhanced styling */}
          <div className="grid gap-4 md:gap-6">
            {/* Recent Orders */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold">Recent Orders</CardTitle>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Latest transactions from your customers</p>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderClick(order.id)}
                      className="block cursor-pointer"
                    >
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200">
                            <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">{order.customer_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs md:text-sm text-gray-500 truncate">{order.email}</p>
                              <span className="hidden md:inline text-gray-300">•</span>
                              <p className="text-xs md:text-sm text-gray-500 truncate">{formatDate(order.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{formatCurrency(order.total)}</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                            order.status === 'completed' && "bg-green-50 text-green-700",
                            order.status === 'processing' && "bg-blue-50 text-blue-700",
                            order.status === 'pending' && "bg-yellow-50 text-yellow-700"
                          )}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="border-b border-gray-100 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold">Revenue Breakdown</CardTitle>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Distribution of revenue by category</p>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  {/* Products Revenue */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 flex-shrink-0 flex items-center justify-center">
                          <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 block truncate">Products</span>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">Hardware and equipment sales</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-3 flex-shrink-0">
                        {formatCurrency(stats.revenue.products)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" 
                        style={{ 
                          width: `${(stats.revenue.products / stats.revenue.total * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Services Revenue */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-50 flex-shrink-0 flex items-center justify-center">
                          <Headphones className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 block truncate">Services</span>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">Professional services</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-3 flex-shrink-0">
                        {formatCurrency(stats.revenue.services)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600" 
                        style={{ 
                          width: `${(stats.revenue.services / stats.revenue.total * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Installation Revenue */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex-shrink-0 flex items-center justify-center">
                          <WrenchIcon className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 block truncate">Installation</span>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">Setup and configuration</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-3 flex-shrink-0">
                        {formatCurrency(stats.revenue.installation)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" 
                        style={{ 
                          width: `${(stats.revenue.installation / stats.revenue.total * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4 mt-4 md:pt-6 md:mt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-medium text-gray-900">Total Revenue</span>
                      <span className="text-lg md:text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.revenue.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 