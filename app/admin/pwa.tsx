'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AdminPWARegister() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're in a PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches

    // If we're in a PWA and not on the products page, redirect
    if (isPWA && pathname === '/admin') {
      router.replace('/admin/products')
    }

    // Register service worker
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', async function() {
        try {
          // Unregister any existing service workers first
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (let registration of registrations) {
            await registration.unregister()
          }

          // Register new service worker
          const registration = await navigator.serviceWorker.register('/admin-sw.js', {
            scope: '/admin/'
          })
          console.log('Admin ServiceWorker registration successful')

          // Force immediate activation
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
        } catch (err) {
          console.log('Admin ServiceWorker registration failed: ', err)
        }
      })
    }
  }, [router, pathname])

  return null
} 