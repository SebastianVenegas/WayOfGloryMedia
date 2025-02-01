import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
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

    // Get current period stats
    const { rows: [currentStats] } = await sql.query(
      `WITH revenue_breakdown AS (
        SELECT 
          SUM(CASE WHEN p.is_service THEN oi.price_at_time * oi.quantity ELSE 0 END) as services_revenue,
          SUM(CASE WHEN NOT p.is_service THEN oi.price_at_time * oi.quantity ELSE 0 END) as products_revenue,
          SUM(CASE WHEN p.category = 'Installation' THEN oi.price_at_time * oi.quantity ELSE 0 END) as installation_revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= NOW() - INTERVAL '${daysAgo} days'
      ),
      service_stats AS (
        SELECT COUNT(DISTINCT o.id) as active_services
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.is_service 
        AND o.created_at >= NOW() - INTERVAL '${daysAgo} days'
      ),
      customer_stats AS (
        SELECT COUNT(DISTINCT CONCAT(o.first_name, o.last_name)) as active_customers
        FROM orders o
        WHERE o.created_at >= NOW() - INTERVAL '${daysAgo} days'
      )
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '${daysAgo} days') as orders_total,
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '${daysAgo * 2} days' AND created_at < NOW() - INTERVAL '${daysAgo} days') as orders_previous,
        rb.services_revenue,
        rb.products_revenue,
        rb.installation_revenue,
        (
          SELECT COALESCE(SUM(oi.price_at_time * oi.quantity), 0)
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.created_at >= NOW() - INTERVAL '${daysAgo * 2} days' 
          AND o.created_at < NOW() - INTERVAL '${daysAgo} days'
        ) as revenue_previous,
        ss.active_services,
        (
          SELECT COUNT(DISTINCT o.id) 
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          WHERE p.is_service 
          AND o.created_at >= NOW() - INTERVAL '${daysAgo * 2} days'
          AND o.created_at < NOW() - INTERVAL '${daysAgo} days'
        ) as services_previous,
        cs.active_customers,
        (
          SELECT COUNT(DISTINCT CONCAT(o.first_name, o.last_name))
          FROM orders o
          WHERE o.created_at >= NOW() - INTERVAL '${daysAgo * 2} days'
          AND o.created_at < NOW() - INTERVAL '${daysAgo} days'
        ) as customers_previous
      FROM revenue_breakdown rb
      CROSS JOIN service_stats ss
      CROSS JOIN customer_stats cs`
    )

    // Format the response
    const stats = {
      revenue: {
        total: Number(currentStats.services_revenue || 0) + Number(currentStats.products_revenue || 0) + Number(currentStats.installation_revenue || 0),
        previousPeriod: Number(currentStats.revenue_previous || 0),
        products: Number(currentStats.products_revenue || 0),
        services: Number(currentStats.services_revenue || 0),
        installation: Number(currentStats.installation_revenue || 0)
      },
      orders: {
        total: Number(currentStats.orders_total || 0),
        previousPeriod: Number(currentStats.orders_previous || 0)
      },
      services: {
        active: Number(currentStats.active_services || 0),
        previousPeriod: Number(currentStats.services_previous || 0)
      },
      customers: {
        active: Number(currentStats.active_customers || 0),
        previousPeriod: Number(currentStats.customers_previous || 0)
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
} 