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

// Add retry configuration
const RETRY_CONFIG = {
  custom_email: {
    maxRetries: 5,
    baseDelay: 3000,
    maxDelay: 15000
  },
  installation: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 10000
  },
  default: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  }
};

// Helper function to get retry config
function getRetryConfig(isCustomEmail, isInstallation) {
  if (isCustomEmail) return RETRY_CONFIG.custom_email;
  if (isInstallation) return RETRY_CONFIG.installation;
  return RETRY_CONFIG.default;
}

// Helper function to handle retries
async function handleRetry(request, retryCount, config) {
  const delay = Math.min(
    config.baseDelay * Math.pow(2, retryCount),
    config.maxDelay
  );
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const headers = new Headers(request.headers);
  headers.set('x-retry-count', (retryCount + 1).toString());
  headers.set('x-pwa-request', 'true');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  return new Request(request.url, {
    method: request.method,
    headers: headers,
    body: request.body,
    credentials: request.credentials,
    mode: 'cors',
    cache: 'no-store'
  });
}

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

self.addEventListener('fetch', async (event) => {
  const url = new URL(event.request.url);
  const isEmailRequest = EMAIL_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
  const isCustomEmail = url.pathname.includes('/custom-email');
  const isInstallationConfirmation = url.pathname.includes('/installation-confirmation');

  if (isEmailRequest) {
    event.respondWith((async () => {
      const retryCount = parseInt(event.request.headers.get('x-retry-count') || '0');
      const config = getRetryConfig(isCustomEmail, isInstallationConfirmation);

      try {
        const headers = new Headers(event.request.headers);
        headers.set('x-pwa-request', 'true');
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        headers.set('Pragma', 'no-cache');
        headers.set('Expires', '0');
        headers.set('x-request-attempt', '1');
        
        if (isCustomEmail) {
          headers.set('x-request-type', 'custom-email');
        }

        const modifiedRequest = new Request(event.request.url, {
          method: event.request.method,
          headers: headers,
          body: event.request.body,
          credentials: request.credentials,
          mode: 'cors',
          cache: 'no-store'
        });

        let response = await fetch(modifiedRequest);
        let attempts = 1;
        
        // Retry on non-200 responses
        while (!response.ok && retryCount < config.maxRetries) {
          console.log(`Attempt ${attempts + 1}/${config.maxRetries + 1} for ${isCustomEmail ? 'custom email' : 'email'} request`);
          
          const retryRequest = await handleRetry(event.request, retryCount, config);
          response = await fetch(retryRequest);
          attempts++;
          
          if (response.ok) break;
        }

        if (!response.ok) {
          throw new Error(`Failed after ${attempts} attempts. Status: ${response.status}`);
        }

        // Clone and validate response
        const responseClone = response.clone();
        const responseBody = await responseClone.text();
        
        try {
          // Validate JSON response
          JSON.parse(responseBody);
        } catch (e) {
          console.error('Invalid JSON response:', responseBody.substring(0, 100));
          throw new Error('Invalid response format');
        }

        // Log success
        console.log('Email request successful:', {
          url: event.request.url,
          type: isCustomEmail ? 'Custom Email' : 'Regular Email',
          attempts,
          status: response.status
        });

        // Return response with enhanced headers
        return new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'x-pwa-generated': 'true',
            'x-pwa-version': '1.0',
            'x-attempts': attempts.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'x-request-type': isCustomEmail ? 'custom-email' : 'email'
          }
        });

      } catch (error) {
        console.error('Service Worker fetch error:', {
          url: event.request.url,
          type: isCustomEmail ? 'Custom Email' : 'Regular Email',
          error: error.message,
          retryCount
        });

        if (retryCount < config.maxRetries) {
          return fetch(await handleRetry(event.request, retryCount, config));
        }

        // Return a structured error response
        return new Response(
          JSON.stringify({
            error: 'Request failed',
            details: error.message,
            type: isCustomEmail ? 'custom-email' : 'email',
            attempts: retryCount + 1
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'x-error-type': 'retry-exhausted'
            }
          }
        );
      }
    })());
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