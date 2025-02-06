import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Define valid status types
type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = Number(url.pathname.split('/').slice(-3, -2)[0]) // Extract orderId from URL

    // Parse request body
    const body = await request.json()
    const { status } = body as { status: OrderStatus }

    // Validate orderId
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'delayed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    // Update order status
    const { rowCount } = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${orderId}
    `

    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: `Order status updated to ${status}` 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update order status' 
      },
      { status: 500 }
    )
  }
} 