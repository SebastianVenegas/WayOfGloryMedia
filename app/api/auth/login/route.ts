import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Login] Starting login process')

    if (!process.env.JWT_SECRET) {
      console.error('[Login] JWT_SECRET is missing in environment variables')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const body = await request.json()
    console.log('[Login] Request body:', { email: body.email, hasPassword: !!body.password })

    const { email, password } = body as LoginRequest

    if (!email || !password) {
      console.error('[Login] Missing email or password')
      return NextResponse.json({ 
        error: 'Please provide both email and password' 
      }, { status: 400 })
    }

    console.log('[Login] Querying database for user')
    // Get user from database
    const { rows } = await sql`
      SELECT * FROM admin_users 
      WHERE email = ${email.toLowerCase()}
    `
    console.log('[Login] Database query result:', { userFound: rows.length > 0 })

    if (rows.length === 0) {
      console.error('[Login] No user found with email:', email)
      return NextResponse.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    const user = rows[0]
    console.log('[Login] Verifying password')

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    console.log('[Login] Password verification result:', { passwordMatch })
    
    if (!passwordMatch) {
      console.error('[Login] Password does not match')
      return NextResponse.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    console.log('[Login] Creating JWT token')
    // Create JWT token with 3-hour expiration
    const token = await new SignJWT({
      email: user.email,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('3h')  // 3 hour expiration
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    console.log('[Login] Token created successfully')

    // Create the response with CORS headers
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    })

    // Get domain from request for cookie settings
    const domain = request.headers.get('host')?.split(':')[0] || undefined

    console.log('[Login] Setting auth cookie with domain:', domain)
    // Set cookie with production-friendly settings
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

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    console.log('[Login] Login successful')
    return response
  } catch (error) {
    console.error('[Login] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'An error occurred while trying to log in. Please try again.' 
    }, { status: 500 })
  }
} 