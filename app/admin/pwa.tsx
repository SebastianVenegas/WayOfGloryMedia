'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Head from 'next/head'

export function AdminPWARegister() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if we're in a PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 // @ts-ignore: Checking for iOS standalone mode
                 window.navigator.standalone === true ||
                 document.referrer.includes('android-app://') ||
                 process.env.NEXT_PUBLIC_PWA === 'true';

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

          // Register new service worker with network-first strategy
          const registration = await navigator.serviceWorker.register('/admin-sw.js', {
            scope: '/admin/',
            updateViaCache: 'none'
          })
          
          console.log('Admin ServiceWorker registration successful')

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, refresh the page
                  if (window.confirm('New version available! Click OK to update.')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Force immediate activation if waiting
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Listen for controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload the page when the service worker takes control
            window.location.reload();
          });

        } catch (err) {
          console.error('Admin ServiceWorker registration failed: ', err)
        }
      })
    }
  }, [router, pathname])

  return (
    <Head>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Way of Glory Admin" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}