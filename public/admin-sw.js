const ADMIN_CACHE_NAME = 'wog-admin-cache-v4';
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
  
  // Only handle admin routes
  if (!url.pathname.startsWith('/admin')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If online and response is ok, return it
        if (response && response.status === 200) {
          // Clone the response for caching
          const responseToCache = response.clone();
          caches.open(ADMIN_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        }
        
        // If response is not ok, try cache
        return caches.match(event.request);
      })
      .catch(() => {
        // If offline, try cache
        return caches.match(event.request);
      })
  );
}); 