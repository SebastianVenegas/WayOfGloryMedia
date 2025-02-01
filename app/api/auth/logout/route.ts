import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear the auth token cookie
  response.cookies.delete('auth_token')
  
  return response
}

// Handle beacon requests
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear the auth token cookie
  response.cookies.delete('auth_token')
  
  return response
} 