import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Define valid status types
type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'delayed'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Parse request body
    const body = await request.json()
    const { status } = body as { status: OrderStatus }
    const orderId = parseInt(params.orderId)

    // Validate orderId
    if (isNaN(orderId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid order ID' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'delayed']
    if (!validStatuses.includes(status)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid status value. Must be one of: ' + validStatuses.join(', ') }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Update order status
    const { rowCount } = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${orderId}
    `

    if (rowCount === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: `Order status updated to ${status}` 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error updating order status:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to update order status' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 