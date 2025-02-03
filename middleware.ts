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
  const pathname = request.nextUrl.pathname

  // Check if it's a PWA request
  const isPWA = request.headers.get('sec-fetch-mode') === 'navigate' && 
                request.headers.get('sec-fetch-dest') === 'document' &&
                request.headers.get('sec-fetch-site') === 'none'

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value

  // If it's a PWA request to the root, redirect to admin login
  if (isPWA && pathname === '/') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // If not an admin route and not a PWA request, skip middleware
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // If no token and trying to access admin routes (except login)
  if (!token && pathname !== '/admin/login') {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If we have a token, verify it
  if (token) {
    const isValidToken = await verifyToken(token)
    if (!isValidToken) {
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }

    // Set short-lived cookie (30 minutes) to enforce frequent re-authentication
    const response = NextResponse.next()
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 60, // 30 minutes
    })

    return response
  }

  // For all other requests
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*'
  ]
} 