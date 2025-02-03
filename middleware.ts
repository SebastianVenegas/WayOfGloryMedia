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

  // If no token and trying to access admin routes (except login)
  if (!token && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // If it's a PWA request, redirect to login with PWA flag
    if (isPWA) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('pwa', 'true')
      return NextResponse.redirect(loginUrl)
    }
    // Otherwise, regular login redirect
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If we have a token, verify it
  if (token) {
    const isValidToken = await verifyToken(token)
    if (!isValidToken) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }

    // If it's a valid token and a PWA request to /admin, redirect to products
    if (isPWA && pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/products', request.url))
    }

    // Set persistent cookie with 3-hour expiration
    const threeHours = 60 * 60 * 3
    const response = NextResponse.next()
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

  // For all other requests
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 