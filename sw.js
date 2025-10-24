/**
 * Service Worker for Trippovention
 * Enables offline support and faster repeat visits
 * Version: 2.8 - Network-first for HTML, cache-first for assets
 */

const CACHE_VERSION = "2.8";
const CACHE_NAME = `trippovention-v${CACHE_VERSION}`;
const RUNTIME_CACHE = "trippovention-runtime";

// Only cache critical assets immediately (not large images)
const PRECACHE_URLS = ["/", "/index.html", "/assets/styles.css", "/assets/app.js"];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Network-first for HTML, cache-first for assets
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Only handle same-origin requests
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Network-first strategy for HTML (always get fresh content)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache valid responses
          if (response && response.status === 200) {
            // Clone BEFORE caching (response body can only be used once)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Cache-first strategy for assets (CSS, JS, images)
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME_CACHE).then((cache) => {
          return fetch(event.request).then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
      .catch(() => caches.match("/index.html"))
  );
});
