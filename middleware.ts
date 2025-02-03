import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

// Get JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

async function verifyToken(token: string) {
  try {
    console.log('[Middleware] Verifying token')
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    
    // Basic token validation
    if (!payload || 
        typeof payload !== 'object' || 
        !payload.email || 
        !payload.role || 
        !payload.name) {
      console.error('[Middleware] Invalid token payload')
      return false
    }

    return true
  } catch (error) {
    console.error('[Middleware] Token verification error:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Processing request:', request.nextUrl.pathname)
  const pathname = request.nextUrl.pathname

  // Only handle admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Skip auth check for login page and API routes
  if (pathname === '/admin/login' || pathname.startsWith('/admin/api/')) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value
  console.log('[Middleware] Token from cookie:', token ? 'present' : 'missing')

  // If no token, redirect to login
  if (!token) {
    console.log('[Middleware] No token found, redirecting to login')
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const isValidToken = await verifyToken(token)
  console.log('[Middleware] Token validation result:', isValidToken)

  if (!isValidToken) {
    console.log('[Middleware] Invalid token, redirecting to login')
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.delete('auth_token')
    return response
  }

  // Get domain from request for cookie settings
  const domain = request.headers.get('host')?.split(':')[0] || undefined
  console.log('[Middleware] Setting cookie with domain:', domain)

  // Set cookie with production-friendly settings
  const response = NextResponse.next()
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: domain === 'localhost' ? undefined : domain,
    maxAge: 60 * 60 * 3 // 3 hours
  })

  return response
}

export const config = {
  matcher: ['/admin/:path*']
} 