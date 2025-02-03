const ADMIN_CACHE_NAME = 'wog-admin-cache-v6';
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
  
  // Only handle navigation requests for admin routes
  if (url.pathname.startsWith('/admin') && event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        // Try network first
        fetch(event.request.clone())
          .then(response => {
            if (response && response.status === 200) {
              // Cache the successful response
              const responseToCache = response.clone();
              caches.open(ADMIN_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            }
            throw new Error('Network response was not ok');
          }),
        
        // If network takes too long or fails, use cache
        new Promise((resolve) => {
          setTimeout(() => {
            caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  resolve(cachedResponse);
                }
              });
          }, 500); // Small timeout to prefer network but fallback quickly
        })
      ]).catch(() => {
        // If both network and race timeout fail, try cache one last time
        return caches.match(event.request);
      })
    );
    return;
  }

  // For non-navigation requests, use a simple network-first strategy
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