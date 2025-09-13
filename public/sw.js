// Service Worker for Apax KnowledgeNow 2025 PWA
// Comprehensive service worker with advanced caching strategies

const CACHE_VERSION = '1.3.0';
const CACHE_NAME = `apax-knowledge-now-2025-v${CACHE_VERSION}`;
const DATA_CACHE_NAME = `apax-data-cache-v${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `apax-images-cache-v${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/icons/icon-152x152.png',
  '/icons/icon-144x144.png',
  '/icons/icon-96x96.png',
  '/icons/icon-72x72.png',
  '/apple-touch-icon.png',
  '/masked-icon.svg',
  '/icon.svg'
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/db/table-data?table=attendees',
  '/api/db/table-data?table=sponsors',
  '/api/db/table-data?table=agenda_items',
  '/api/db/table-data?table=seat_assignments',
  '/api/db/table-data?table=dining_options',
  '/api/db/table-data?table=hotels',
  '/api/db/table-data?table=seating_configurations',
  '/api/db/table-data?table=user_profiles'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize data cache
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('💾 Data cache initialized');
        return cache;
      }),
      // Initialize image cache
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        console.log('🖼️ Image cache initialized');
        return cache;
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      self.skipWaiting();
    }).catch((error) => {
      console.error('❌ Service Worker installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const validCaches = [CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME];
      
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip Vite dev server requests
  if (url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.includes('vite') ||
      url.hostname === 'localhost' && url.port === '3000') {
    return;
  }

  // Determine caching strategy based on request type
  if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      console.log('🌐 API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📱 Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No cached data available',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('🖼️ Image served from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🌐 Image cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Image fetch failed:', request.url);
    // Return a placeholder image or error
    return new Response('Image not available', { status: 404 });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return cache.match('/offline') || new Response('Offline', { status: 503 });
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Static asset fetch failed:', request.url);
    return new Response('Asset not available', { status: 404 });
  }
}

// Helper functions
function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('localhost:3000/api/');
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for data updates
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'data-sync') {
    event.waitUntil(syncDataInBackground());
  }
});

// Background data sync
async function syncDataInBackground() {
  console.log('🔄 Starting background data sync...');
  
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
          console.log('✅ Background sync completed:', endpoint);
        }
      } catch (error) {
        console.log('⚠️ Background sync failed for:', endpoint, error);
      }
    }
    
    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Apax KnowledgeNow 2025', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_DATA') {
    event.waitUntil(cacheDataFromMainThread(event.data.data));
  }
});

// Cache data from main thread
async function cacheDataFromMainThread(data) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  for (const [endpoint, dataArray] of Object.entries(data)) {
    const response = new Response(JSON.stringify(dataArray), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(endpoint, response);
    console.log('💾 Data cached from main thread:', endpoint);
  }
}
