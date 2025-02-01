import { NextRequest } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

interface AuthResult {
  isAuthenticated: boolean
  error?: string
  payload?: any
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    console.log('Starting auth verification')
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header:', authHeader)
    
    let token = authHeader?.split(' ')[1]
    
    // If no token in header, try cookies
    if (!token) {
      console.log('No token in header, checking cookies')
      const cookies = request.cookies
      token = cookies.get('auth_token')?.value
      console.log('Token from cookie:', token)
    }

    if (!token) {
      console.log('No token found')
      return { isAuthenticated: false, error: 'No token found' }
    }

    try {
      console.log('Attempting to verify token')
      const { payload } = await jose.jwtVerify(
        token,
        JWT_SECRET
      )
      console.log('Token payload:', payload)

      if (!payload.role || !payload.email) {
        console.log('Missing required fields in token')
        return { isAuthenticated: false, error: 'Invalid token payload' }
      }

      return { isAuthenticated: true, payload }
    } catch (e) {
      console.error('Token verification failed:', e)
      return { isAuthenticated: false, error: 'Invalid token' }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { isAuthenticated: false, error: 'Auth verification failed' }
  }
}

export interface User {
  email: string;
  role: string;
  name: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<User> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = (await response.json()) as LoginResponse;
  
  // Store the token in localStorage
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data.user;
};

export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const checkAuth = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return null;
    }

    const response = await fetch("/api/auth/check", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: 'no-store',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.location.href = '/admin/login';
        return null;
      }
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.user) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("[Auth] Check auth error:", error);
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}; 