import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // Clear the auth token cookie
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')

  return NextResponse.json({ success: true })
} 