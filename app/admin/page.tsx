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
  BarChart,
  Activity,
  Loader
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [ordersRes, statsRes] = await Promise.all([
          fetch(`/api/orders?period=${selectedPeriod}`),
          fetch(`/api/stats?period=${selectedPeriod}`)
        ])

        if (!ordersRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [ordersData, statsData] = await Promise.all([
          ordersRes.json(),
          statsRes.json()
        ])

        setOrders(ordersData)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedPeriod])

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
      year: 'numeric'
    }).format(new Date(dateString))
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>Download Reports</Button>
        </div>
      </div>
      
      <Tabs defaultValue={selectedPeriod} className="space-y-4">
        <TabsList>
          <TabsTrigger value="1d" onClick={() => setSelectedPeriod('1d')}>Today</TabsTrigger>
          <TabsTrigger value="7d" onClick={() => setSelectedPeriod('7d')}>Last 7 days</TabsTrigger>
          <TabsTrigger value="30d" onClick={() => setSelectedPeriod('30d')}>Last 30 days</TabsTrigger>
          <TabsTrigger value="90d" onClick={() => setSelectedPeriod('90d')}>Last 90 days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-4">
          {/* Overview Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateGrowth(stats.revenue.total, stats.revenue.previousPeriod).toFixed(1)}% from previous period
                </p>
                <div className="mt-4 h-[60px]">
                  <BarChart className="h-full w-full text-emerald-500/25" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.orders.total}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateGrowth(stats.orders.total, stats.orders.previousPeriod).toFixed(1)}% from previous period
                </p>
                <div className="mt-4 h-[60px]">
                  <Activity className="h-full w-full text-blue-500/25" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.services.active}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateGrowth(stats.services.active, stats.services.previousPeriod).toFixed(1)}% from previous period
                </p>
                <div className="mt-4 h-[60px]">
                  <TrendingUp className="h-full w-full text-purple-500/25" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customers.active}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateGrowth(stats.customers.active, stats.customers.previousPeriod).toFixed(1)}% from previous period
                </p>
                <div className="mt-4 h-[60px]">
                  <TrendingUp className="h-full w-full text-orange-500/25" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                        <div className={`text-xs ${
                          order.status === 'completed' 
                            ? 'text-green-500' 
                            : order.status === 'processing' 
                              ? 'text-blue-500' 
                              : 'text-orange-500'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Products</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.products)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Services</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.services)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Installation</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.installation)}</p>
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