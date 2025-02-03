const ADMIN_CACHE_NAME = 'wog-admin-cache-v1';
const urlsToCache = [
  '/admin/products',
  '/admin/products?source=pwa',
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
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If we get a response other than 200 OK for navigation,
          // redirect to the admin products page
          if (!response || response.status !== 200) {
            return Response.redirect('/admin/products', 302);
          }
          return response;
        })
        .catch(() => {
          // On offline or error, try to serve from cache
          return caches.match('/admin/products')
            .then(response => response || Response.redirect('/admin/products', 302));
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