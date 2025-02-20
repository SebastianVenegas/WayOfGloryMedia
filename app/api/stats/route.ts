import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    
    let daysAgo
    switch (period) {
      case '1d':
        daysAgo = 1
        break
      case '30d':
        daysAgo = 30
        break
      case '90d':
        daysAgo = 90
        break
      default:
        daysAgo = 7
    }

    // Get current period stats with default values
    const { rows } = await sql`
      WITH current_period AS (
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(product_subtotal), 0) as product_revenue,
          COALESCE(SUM(service_subtotal), 0) as service_revenue,
          COALESCE(SUM(installation_price), 0) as installation_revenue,
          COALESCE(COUNT(*), 0) as total_orders,
          COALESCE(COUNT(CASE WHEN contains_services THEN 1 END), 0) as active_services,
          COALESCE(COUNT(DISTINCT email), 0) as active_customers
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${daysAgo} days'
      ),
      previous_period AS (
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(COUNT(*), 0) as total_orders,
          COALESCE(COUNT(CASE WHEN contains_services THEN 1 END), 0) as active_services,
          COALESCE(COUNT(DISTINCT email), 0) as active_customers
        FROM orders
        WHERE 
          created_at >= NOW() - INTERVAL '${daysAgo * 2} days' AND
          created_at < NOW() - INTERVAL '${daysAgo} days'
      )
      SELECT 
        COALESCE(cp.total_revenue, 0) as total_revenue,
        COALESCE(cp.product_revenue, 0) as product_revenue,
        COALESCE(cp.service_revenue, 0) as service_revenue,
        COALESCE(cp.installation_revenue, 0) as installation_revenue,
        COALESCE(cp.total_orders, 0) as total_orders,
        COALESCE(cp.active_services, 0) as active_services,
        COALESCE(cp.active_customers, 0) as active_customers,
        COALESCE(pp.total_revenue, 0) as previous_revenue,
        COALESCE(pp.total_orders, 0) as previous_orders,
        COALESCE(pp.active_services, 0) as previous_services,
        COALESCE(pp.active_customers, 0) as previous_customers
      FROM current_period cp
      CROSS JOIN previous_period pp
    `

    // Ensure we have at least one row with default values
    const stats = rows[0] || {
      total_revenue: 0,
      product_revenue: 0,
      service_revenue: 0,
      installation_revenue: 0,
      total_orders: 0,
      active_services: 0,
      active_customers: 0,
      previous_revenue: 0,
      previous_orders: 0,
      previous_services: 0,
      previous_customers: 0
    }

    // Convert all values to numbers and ensure they're not null
    const response = {
      revenue: {
        total: Number(stats.total_revenue) || 0,
        previousPeriod: Number(stats.previous_revenue) || 0,
        products: Number(stats.product_revenue) || 0,
        services: Number(stats.service_revenue) || 0,
        installation: Number(stats.installation_revenue) || 0
      },
      orders: {
        total: Number(stats.total_orders) || 0,
        previousPeriod: Number(stats.previous_orders) || 0
      },
      services: {
        active: Number(stats.active_services) || 0,
        previousPeriod: Number(stats.previous_services) || 0
      },
      customers: {
        active: Number(stats.active_customers) || 0,
        previousPeriod: Number(stats.previous_customers) || 0
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 