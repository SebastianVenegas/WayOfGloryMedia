const ADMIN_CACHE_NAME = 'wog-admin-cache-v8';
const API_CACHE_NAME = 'wog-admin-api-cache-v1';

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

// Email-related endpoints that should never be cached
const EMAIL_ENDPOINTS = [
  '/preview-template',
  '/custom-email',
  '/generate-email',
  '/send-template',
  '/installation-confirmation'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(ADMIN_CACHE_NAME).then(cache => cache.addAll(urlsToCache)),
      // Clear any existing API cache on install
      caches.delete(API_CACHE_NAME)
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear all caches except the current version
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== ADMIN_CACHE_NAME && cacheName !== API_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Helper function to check if a request is for an email endpoint
function isEmailEndpoint(url) {
  return EMAIL_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

// Helper function to check if a request is an API call
function isApiRequest(url) {
  return url.pathname.includes('/api/');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle email-related endpoints with network-only strategy
  if (isEmailEndpoint(url)) {
    event.respondWith(
      handleEmailRequest(event.request)
    );
    return;
  }

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(
      handleApiRequest(event.request)
    );
    return;
  }

  // Handle navigation requests
  if (url.pathname.startsWith('/admin') && event.request.mode === 'navigate') {
    event.respondWith(
      handleNavigationRequest(event.request)
    );
    return;
  }

  // Handle all other requests
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(
      handleStaticRequest(event.request)
    );
  }
});

// Handle email-related requests (network-only with retry)
async function handleEmailRequest(request) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const requestClone = request.clone();
      const headers = new Headers(requestClone.headers);
      
      // Always add fresh headers for email requests
      headers.set('x-pwa-request', 'true');
      headers.set('x-pwa-version', '1.0');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');

      const response = await fetch(new Request(requestClone.url, {
        method: requestClone.method,
        headers: headers,
        body: requestClone.method !== 'GET' ? await requestClone.clone().text() : undefined,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'follow'
      }));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clone and log the response for debugging
      const responseClone = response.clone();
      const responseBody = await responseClone.text();
      console.log('Email request successful:', {
        url: request.url,
        status: response.status,
        body: responseBody.substring(0, 100) + '...' // Log first 100 chars
      });

      return response;
    } catch (error) {
      lastError = error;
      console.error(`Email request attempt ${i + 1} failed:`, {
        url: request.url,
        error: error.message,
        attempt: i + 1
      });

      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
      }
    }
  }

  return new Response(
    JSON.stringify({
      error: 'Failed to complete email request after multiple retries',
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

// Handle API requests (network-first with short cache)
async function handleApiRequest(request) {
  try {
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, responseToCache);
      return response;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle navigation requests (network-first with timeout fallback)
async function handleNavigationRequest(request) {
  try {
    const networkPromise = fetch(request.clone()).then(response => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(ADMIN_CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return response;
      }
      throw new Error('Network response was not ok');
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 3000);
    });

    return await Promise.race([networkPromise, timeoutPromise]);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle static requests (network-first)
async function handleStaticRequest(request) {
  try {
    const response = await fetch(request.clone());
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      const cache = await caches.open(ADMIN_CACHE_NAME);
      await cache.put(request, responseToCache);
      return response;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
} 