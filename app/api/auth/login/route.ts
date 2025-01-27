import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Get user from database
    const { rows } = await sql`
      SELECT * FROM admin_users 
      WHERE email = ${email}
    `

    const user = rows[0]

    // Check if user exists and verify password
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await new jose.SignJWT({ 
      email: user.email,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(JWT_SECRET)

    // Create response with redirect URL
    const response = NextResponse.json({ 
      success: true,
      redirectTo: '/admin/products'
    })

    // Set session cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 