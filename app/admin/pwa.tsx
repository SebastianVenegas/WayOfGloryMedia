'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Head from 'next/head'

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
          for (const registration of registrations) {
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

  return (
    <Head>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}