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

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Check if it's an admin path
  const isAdminPath = path.startsWith('/admin')
  const isLoginPath = path === '/admin/login'

  // Get the token from cookies
  const token = request.cookies.get('admin_token')?.value

  // If trying to access admin pages without token
  if (isAdminPath && !token && !isLoginPath) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If trying to access login page with valid token
  if (isLoginPath && token) {
    const dashboardUrl = new URL('/admin', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// Configure the paths that should be protected
export const config = {
  matcher: ['/admin/:path*']
} 