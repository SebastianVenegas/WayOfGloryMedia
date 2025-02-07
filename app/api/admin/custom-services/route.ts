import { NextResponse, NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// GET /api/admin/custom-services
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      SELECT * FROM products 
      WHERE is_custom = true 
      AND status = 'active'
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
    const auth = await verifyAuth(request)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, price, features } = body
    const userEmail = request.headers.get('user-email')

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: "At least one feature is required" }, { status: 400 })
    }

    const featuresJson = JSON.stringify(features)

    const result = await sql`
      INSERT INTO products (
        title, 
        description, 
        price, 
        features,
        created_by,
        updated_by,
        is_custom,
        category,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${title}, 
        ${description}, 
        ${price}, 
        ${featuresJson}::jsonb,
        ${userEmail || 'unknown'},
        ${userEmail || 'unknown'},
        true,
        'Services',
        'active',
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Custom service created successfully",
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating custom service:', error)
    return NextResponse.json({ 
      error: 'Failed to create custom service',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 