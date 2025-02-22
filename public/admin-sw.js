const ADMIN_CACHE_NAME = 'wog-admin-cache-v7';
const urlsToCache = [
  '/admin',
  '/admin/products',
  '/admin/orders',
  '/admin/customers',
  '/admin/analytics',
  '/admin/settings',
  '/admin/services',
  '/admin-manifest.json',
  '/icons/admin-icon-192x192.png',
  '/icons/admin-icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ADMIN_CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== ADMIN_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Special handling for API requests
  if (url.pathname.includes('/api/')) {
    // For email template and generation endpoints, use network-only with retry
    if (url.pathname.includes('/preview-template') || 
        url.pathname.includes('/custom-email') || 
        url.pathname.includes('/generate-email')) {
      event.respondWith(
        handleApiRequest(event.request)
      );
      return;
    }
    
    // For other API requests, use network-first with short cache
    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(ADMIN_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
          throw new Error('Network response was not ok');
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Handle navigation requests for admin routes
  if (url.pathname.startsWith('/admin') && event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        // Try network first
        fetch(event.request.clone())
          .then(response => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(ADMIN_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            }
            throw new Error('Network response was not ok');
          }),
        
        // If network takes too long, use cache
        new Promise((resolve) => {
          setTimeout(() => {
            caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  resolve(cachedResponse);
                }
              });
          }, 500);
        })
      ]).catch(() => caches.match(event.request))
    );
    return;
  }

  // For other requests, use network-first strategy
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(ADMIN_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
          return caches.match(event.request);
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Helper function to handle API requests with retry
async function handleApiRequest(request) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Clone the request since we might need to retry
      const requestClone = request.clone();
      
      // Add PWA-specific headers
      const headers = new Headers(requestClone.headers);
      headers.set('x-pwa-request', 'true');
      headers.set('x-pwa-version', '1.0');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      const response = await fetch(new Request(requestClone.url, {
        method: requestClone.method,
        headers: headers,
        body: requestClone.method !== 'GET' ? await requestClone.clone().text() : undefined,
        mode: requestClone.mode,
        credentials: requestClone.credentials,
        cache: 'no-store'
      }));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`API request attempt ${i + 1} failed:`, error);
      
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    }
  }
  
  // If all retries failed, return an error response
  return new Response(
    JSON.stringify({
      error: 'Failed to complete request after multiple retries',
      details: lastError?.message || 'Unknown error'
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
} 