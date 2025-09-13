// Simple service worker for development
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Simple passthrough for development
  event.respondWith(fetch(event.request))
})
