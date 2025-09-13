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
  // Only handle specific requests, let Vite dev server handle everything else
  const url = new URL(event.request.url)
  
  // Skip Vite dev server requests
  if (url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.includes('vite')) {
    return
  }
  
  // Handle other requests normally
  event.respondWith(fetch(event.request))
})
