import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    
    // Strict token validation
    if (!payload || 
        typeof payload !== 'object' || 
        !payload.email || 
        !payload.role || 
        !payload.name || 
        !payload.exp || 
        Date.now() >= payload.exp * 1000) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAdminPath = path.startsWith('/admin') && path !== '/admin/login'

  // Get the token from cookies
  const token = request.cookies.get('auth_token')?.value

  // For admin paths, require valid token
  if (isAdminPath) {
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const isValidToken = await verifyToken(token)
    if (!isValidToken) {
      // Clear the invalid token and redirect
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }

    // Token is valid, allow access
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Configure the paths that middleware will run on
export const config = {
  matcher: ['/admin/:path*']
} 