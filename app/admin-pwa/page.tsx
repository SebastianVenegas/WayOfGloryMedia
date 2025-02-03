'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPWA() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to admin products
    router.replace('/admin/products')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
} 