'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AdminPWARegister() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're in a PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    const isFromPWA = new URLSearchParams(window.location.search).get('source') === 'pwa'

    // If we're in a PWA and on the root admin page, redirect to products
    if ((isPWA || isFromPWA) && window.location.pathname === '/admin') {
      router.replace('/admin/products')
    }

    // Register service worker
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/admin-sw.js').then(
          function(registration) {
            console.log('Admin ServiceWorker registration successful');
            // Force update on new service worker
            registration.update()
          },
          function(err) {
            console.log('Admin ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, [router]);

  return null;
} 