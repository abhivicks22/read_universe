// Anti Gravity Service Worker — cache-first for static, network-first for pages
const CACHE_NAME = 'universe-read-v1';

const STATIC_ASSETS = [
    '/',
    '/library',
    '/vocabulary',
    '/manifest.json',
];

// Install — pre-cache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and external requests
    if (event.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // Navigation requests (pages) — network-first
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets — cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                // Cache JS, CSS, fonts, images
                if (response.ok && (
                    url.pathname.endsWith('.js') ||
                    url.pathname.endsWith('.css') ||
                    url.pathname.endsWith('.woff2') ||
                    url.pathname.endsWith('.png') ||
                    url.pathname.endsWith('.svg') ||
                    url.pathname.startsWith('/_next/')
                )) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
