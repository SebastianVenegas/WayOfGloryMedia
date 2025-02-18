import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const response = new NextResponse(
      JSON.stringify({ success: true }),
      { status: 200 }
    )

    // Clear all admin authentication cookies
    response.cookies.set({
      name: 'admin_token',
      value: '',
      expires: new Date(0),
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    })

    response.cookies.set({
      name: 'admin_email',
      value: '',
      expires: new Date(0),
      path: '/'
    })

    response.cookies.set({
      name: 'admin_name',
      value: '',
      expires: new Date(0),
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to logout admin' }),
      { status: 500 }
    )
  }
}

// Handle beacon requests
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear the admin token cookie
  response.cookies.delete('admin_token')
  
  return response
} 