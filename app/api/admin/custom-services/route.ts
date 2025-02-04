import { NextResponse, NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

// GET /api/admin/custom-services
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE is_custom = true 
      ORDER BY created_at DESC
    `
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching custom services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom services' },
      { status: 500 }
    )
  }
}

// POST /api/admin/custom-services
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, price, features } = body
    const userEmail = request.headers.get('user-email')

    const featuresJson = JSON.stringify(features || [])

    const result = await sql`
      INSERT INTO products (
        title, 
        description, 
        price, 
        features,
        created_by,
        is_custom,
        category
      ) VALUES (
        ${title}, 
        ${description}, 
        ${price}, 
        ${featuresJson}::jsonb,
        ${userEmail || 'unknown'},
        true,
        'Services'
      )
      RETURNING *
    `

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating custom service:', error)
    return NextResponse.json({ 
      error: 'Failed to create custom service',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 