// Silkroad Platform — Service Worker (V2 Force Reload Upgrade)
// Clears block caches to allow immediate visual updates for development

const CACHE_NAME = 'silkroad-v2';
const TILE_CACHE = 'silkroad-tiles-v2';

const APP_SHELL = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => caches.delete(k))
      )
    ).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Map tiles offline cache
  if (
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.pathname.match(/\/\d+\/\d+\/\d+/)
  ) {
    event.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Network first for core files to bypass old visual caching during development
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
