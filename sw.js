/**
 * Service Worker for Trippovention
 * Enables offline support and faster repeat visits
 */

const CACHE_NAME = 'trippovention-v1';
const RUNTIME_CACHE = 'trippovention-runtime';

// Files to cache immediately
const PRECACHE_URLS = [
	'/',
	'/index.html',
	'/tours.html',
	'/services.html',
	'/contact.html',
	'/assets/styles.min.css',
	'/assets/app.js',
	'/assets/images/logo.webp',
	'./assets/images/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames
					.filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
					.map(cacheName => caches.delete(cacheName))
			);
		}).then(() => self.clients.claim())
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}
	
	// Skip external requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}
	
	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			if (cachedResponse) {
				return cachedResponse;
			}
			
			return caches.open(RUNTIME_CACHE).then(cache => {
				return fetch(event.request).then(response => {
					// Cache successful responses
					if (response.status === 200) {
						cache.put(event.request, response.clone());
					}
					return response;
				});
			});
		}).catch(() => {
			// Return offline page if available
			return caches.match('/index.html');
		})
	);
});
