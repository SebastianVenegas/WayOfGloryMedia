import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ 
        error: 'No token found' 
      }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing')
      return NextResponse.json({ 
        error: 'Internal server error' 
      }, { status: 500 })
    }

    // Verify the token
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )

    if (!verified.payload) {
      return NextResponse.json({ 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      user: verified.payload
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ 
      error: 'Invalid token' 
    }, { status: 401 })
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
} 