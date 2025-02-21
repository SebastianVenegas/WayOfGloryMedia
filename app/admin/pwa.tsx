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
          // Unregister any existing service workers first to ensure clean state
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
                    // Clear caches before reloading
                    caches.keys().then(function(names) {
                      for (let name of names) caches.delete(name);
                    });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Force immediate activation if waiting
          if (registration.waiting) {
            // Clear caches before activating new service worker
            await caches.keys().then(function(names) {
              return Promise.all(names.map(function(name) {
                return caches.delete(name);
              }));
            });
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Listen for controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Clear caches and reload the page when the service worker takes control
            caches.keys().then(function(names) {
              for (let name of names) caches.delete(name);
            });
            window.location.reload();
          });

          // Add custom event listener for network errors and retries
          window.addEventListener('fetch', function(event: Event) {
            if (event instanceof ErrorEvent) {
              console.error('Fetch error:', event.error);
              
              // Handle the fetch error
              const handleFetchError = async (request: Request) => {
                try {
                  // Check if this is an email template request
                  if (request.url.includes('/preview-template') || request.url.includes('/custom-email') || request.url.includes('/generate-email')) {
                    console.log('Retrying email template request:', request.url);
                    
                    // Add PWA headers and prevent caching
                    const retryResponse = await fetch(request.url, {
                      method: request.method,
                      headers: {
                        ...Object.fromEntries(request.headers.entries()),
                        'x-pwa-request': 'true',
                        'x-pwa-version': '1.0',
                        'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'Surrogate-Control': 'no-store'
                      },
                      body: request.method !== 'GET' ? await request.clone().text() : undefined,
                      cache: 'no-store',
                      credentials: 'include'
                    });

                    if (!retryResponse.ok) {
                      throw new Error(`Retry failed with status ${retryResponse.status}`);
                    }

                    return retryResponse;
                  }

                  // For other requests, just retry with PWA header
                  return await fetch(request.url, {
                    ...request,
                    headers: {
                      ...Object.fromEntries(request.headers.entries()),
                      'x-pwa-request': 'true'
                    },
                    cache: 'no-store'
                  });
                } catch (error) {
                  console.error('Retry failed:', error);
                  return new Response(
                    JSON.stringify({ 
                      error: 'Network error', 
                      details: error instanceof Error ? error.message : 'Unknown error'
                    }),
                    { 
                      status: 503,
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                }
              };

              if (event.target instanceof Request) {
                event.preventDefault();
                return handleFetchError(event.target);
              }
            }
          }, true);

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
      <meta name="theme-color" content="#ffffff" />
      <meta name="background-color" content="#ffffff" />
    </Head>
  )
}