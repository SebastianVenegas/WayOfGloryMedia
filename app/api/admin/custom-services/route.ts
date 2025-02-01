import { NextResponse, NextRequest } from 'next/server'
import { sql } from '@vercel/postgres'
import { verifyAuth } from '@/lib/auth'

// GET /api/admin/custom-services
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM custom_services 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching custom services:', error)
    return NextResponse.json({ error: 'Failed to fetch custom services' }, { status: 500 })
  }
}

// POST /api/admin/custom-services
export async function POST(request: NextRequest) {
  try {
    console.log('Received request to create custom service')
    
    const authResult = await verifyAuth(request)
    console.log('Auth result:', authResult)
    
    if (!authResult.isAuthenticated) {
      console.log('Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { title, description, price, features } = body
    const userEmail = request.headers.get('user-email')
    console.log('User email from header:', userEmail)

    // Convert features array to JSON string
    const featuresJson = JSON.stringify(features || [])
    console.log('Features JSON:', featuresJson)

    console.log('Attempting database insert with values:', {
      title,
      description,
      price,
      features: featuresJson,
      created_by: userEmail
    })

    const result = await sql`
      INSERT INTO custom_services (
        title, 
        description, 
        price, 
        features,
        created_by
      ) VALUES (
        ${title}, 
        ${description}, 
        ${price}, 
        ${featuresJson}::jsonb,
        ${userEmail || 'unknown'}
      )
      RETURNING *
    `

    console.log('Database result:', result.rows[0])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Detailed error creating custom service:', error)
    return NextResponse.json({ 
      error: 'Failed to create custom service',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 