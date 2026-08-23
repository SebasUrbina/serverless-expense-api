const CACHE_PREFIX = 'seva-';
const CACHE_NAME = `${CACHE_PREFIX}runtime-v2`;
const MAX_RUNTIME_ENTRIES = 80;
const OFFLINE_URL = '/offline';
const APP_SHELL = [
  OFFLINE_URL,
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.all(
          APP_SHELL.map(async (asset) => {
            try {
              await cache.add(asset);
            } catch {
              // Ignore assets that may not be available during install.
            }
          }),
        );
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname === '/sw.js') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(handleStaticRequest(request));
});

async function handleNavigationRequest(request) {
  const cacheKey = getNavigationCacheKey(request);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await putInRuntimeCache(cacheKey, networkResponse);
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    const url = new URL(request.url);
    const isImmutableNextAsset = url.pathname.startsWith('/_next/static/');
    if (!isImmutableNextAsset) {
      void refreshCache(request);
    }
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok && networkResponse.type === 'basic') {
    await putInRuntimeCache(request, networkResponse);
  }
  return networkResponse;
}

function getNavigationCacheKey(request) {
  const url = new URL(request.url);
  // Static exports serve the same document regardless of client-side filters.
  url.search = '';
  url.hash = '';
  return new Request(url.href, { method: 'GET' });
}

async function refreshCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      await putInRuntimeCache(request, response);
    }
  } catch {
    // Ignore background refresh failures.
  }
}

async function putInRuntimeCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());

  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME_ENTRIES) {
    await Promise.all(
      keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES).map((key) =>
        cache.delete(key),
      ),
    );
  }
}
