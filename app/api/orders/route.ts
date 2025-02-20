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

    const { rows } = await sql.query(`
      SELECT 
        id,
        first_name || ' ' || last_name as customer_name,
        email,
        total_amount as total,
        status,
        created_at,
        payment_status,
        total_paid,
        remaining_balance,
        contains_services
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${daysAgo} days'
      ORDER BY created_at DESC
      LIMIT 10
    `)

    // Transform the data to match the expected format
    const orders = rows.map(order => ({
      id: order.id,
      customer_name: order.customer_name,
      email: order.email,
      total: Number(order.total),
      status: order.status,
      created_at: order.created_at,
      payment_status: order.payment_status,
      total_paid: Number(order.total_paid),
      remaining_balance: Number(order.remaining_balance),
      contains_services: order.contains_services
    }))

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 