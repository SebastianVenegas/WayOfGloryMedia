import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined
    const authHeader = request.headers.get('Authorization')
    token = authHeader?.split(' ')[1]

    // If no token in header, try cookies
    if (!token) {
      token = request.cookies.get('auth_token')?.value
    }

    if (!token) {
      console.error('[Auth Check] No token found in header or cookies')
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      console.error('[Auth Check] JWT_SECRET is missing in environment variables')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Convert JWT_SECRET to Uint8Array for jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    try {
      const { payload } = await jwtVerify(token, secret)
      
      // Verify that the payload has the required fields
      if (!payload.email || !payload.role || !payload.name) {
        console.error('[Auth Check] Invalid token payload:', payload)
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      // Create the response
      const response = NextResponse.json({
        success: true,
        user: {
          email: payload.email as string,
          role: payload.role as string,
          name: payload.name as string
        }
      })

      // Set persistent cookie with 3-hour expiration
      const threeHours = 60 * 60 * 3 // 3 hours in seconds
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: threeHours,
        expires: new Date(Date.now() + threeHours * 1000)
      })

      // Set CORS headers
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return response
    } catch (jwtError) {
      console.error('[Auth Check] JWT verification failed:', jwtError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    console.error('[Auth Check] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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