import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    
    // Basic token validation
    if (!payload || 
        typeof payload !== 'object' || 
        !payload.email || 
        !payload.role || 
        !payload.name) {
      console.error('[Token Validation] Invalid token payload')
      return false
    }

    return true
  } catch (error) {
    console.error('[Token Validation] Error:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  // Check if it's a PWA by looking for display-mode header
  const isPWA = request.headers.get('sec-fetch-mode') === 'navigate' && 
                request.headers.get('sec-fetch-dest') === 'document' &&
                request.headers.get('sec-fetch-site') === 'none'

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // If it's a PWA request to /admin, redirect to /admin/products
  if (isPWA && pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/products', request.url))
  }

  // Define protected paths
  const isAdminPath = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isProtectedApiPath = pathname.startsWith('/api/admin')
  const isAuthCheck = pathname === '/api/auth/check'

  // Skip middleware for OPTIONS requests
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value

  // Handle auth check endpoint
  if (isAuthCheck) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isValidToken = await verifyToken(token)
    if (!isValidToken) {
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      response.cookies.delete('auth_token')
      return response
    }

    return NextResponse.next()
  }

  // Handle protected paths
  if (isAdminPath || isProtectedApiPath) {
    if (!token) {
      if (isProtectedApiPath) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Redirect to login for admin pages
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const isValidToken = await verifyToken(token)
    if (!isValidToken) {
      const response = isProtectedApiPath
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', request.url))
      
      response.cookies.delete('auth_token')
      return response
    }

    // Clone the response to add headers
    const response = NextResponse.next()
    
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

    return response
  }

  return NextResponse.next()
}

// Configure the paths that middleware will run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*', 
    '/api/auth/check'
  ]
} 