const ADMIN_CACHE_NAME = 'wog-admin-cache-v2';
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
  // Clean up old caches
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
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            // Check if the requested URL is in our cache
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // If not in cache and response is not ok, redirect to products
                return Response.redirect('/admin/products', 302);
              });
          }
          return response;
        })
        .catch(() => {
          // On offline or error, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/admin/products')
                .then(response => response || Response.redirect('/admin/products', 302));
            });
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(ADMIN_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
}); 