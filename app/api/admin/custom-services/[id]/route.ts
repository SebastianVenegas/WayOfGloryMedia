import { NextResponse, NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const result = await sql`
      SELECT * FROM custom_services 
      WHERE id = ${context.params.id}
    `
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Custom service not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching custom service:', error)
    return NextResponse.json({ error: 'Failed to fetch custom service' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, price, features } = await request.json()

    const result = await sql`
      UPDATE custom_services 
      SET 
        title = ${title},
        description = ${description},
        price = ${price},
        features = ${features},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${context.params.id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Custom service not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating custom service:', error)
    return NextResponse.json({ error: 'Failed to update custom service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      UPDATE custom_services 
      SET is_active = false 
      WHERE id = ${context.params.id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Custom service not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error deleting custom service:', error)
    return NextResponse.json({ error: 'Failed to delete custom service' }, { status: 500 })
  }
} 