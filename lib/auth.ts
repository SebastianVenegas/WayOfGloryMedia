import { cookies } from 'next/headers'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

interface AuthResult {
  isAuthenticated: boolean
  error?: string
}

export async function verifyAuth(): Promise<AuthResult> {
  try {
    // Get the token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return { isAuthenticated: false, error: 'No token found' }
    }

    // Verify the token
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)

    if (!payload || typeof payload !== 'object' || payload.role !== 'admin') {
      return { isAuthenticated: false, error: 'Invalid token' }
    }

    return { isAuthenticated: true }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { isAuthenticated: false, error: 'Invalid token' }
  }
} 