import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, price, features, category, metadata } = body

    if (!title || !description || !price) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        }, 
        { status: 400 }
      )
    }

    // Create the product in the database using SQL
    const result = await sql`
      INSERT INTO products (
        title,
        description,
        price,
        features,
        category,
        is_custom,
        is_service,
        status,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        ${title},
        ${description},
        ${parseFloat(price.toString())},
        ${features || []},
        'Services',
        true,
        true,
        'active',
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        NOW(),
        NOW()
      ) RETURNING *
    `

    const product = result.rows[0]

    return NextResponse.json({ 
      success: true, 
      product: {
        ...product,
        id: product.id.toString(),
        metadata: metadata || null
      }
    })
  } catch (error: any) {
    // Log the actual error for debugging
    console.error('Failed to create custom service:', error?.message || error)
    
    // Return a structured error response
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to create custom service'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM products 
      WHERE category = 'Services' 
      AND is_custom = true 
      ORDER BY created_at DESC
    `
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching custom services:', error)
    return NextResponse.json({ error: 'Failed to fetch custom services' }, { status: 500 })
  }
} 