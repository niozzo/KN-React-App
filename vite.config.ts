import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false  // Disable PWA in development to prevent interference
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.png', 'icons/*'],
      manifest: {
        name: 'Apax KnowledgeNow 2025 App',
        short_name: 'KnowledgeNow 2025',
        description: 'Apax KnowledgeNow 2025 - Conference PWA Application',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#9468CE',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'en',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/masked-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/mobile-390x844.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: '/screenshots/tablet-768x1024.png',
            sizes: '768x1024',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshots/desktop-1280x720.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          }
        ],
        shortcuts: [
          {
            name: 'View Schedule',
            short_name: 'Schedule',
            description: 'View the conference schedule',
            url: '/schedule',
            icons: [
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96'
              }
            ]
          },
          {
            name: 'Meet People',
            short_name: 'Meet',
            description: 'Connect with other attendees',
            url: '/meet',
            icons: [
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96'
              }
            ]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: null, // Disable navigate fallback in dev
        navigateFallbackDenylist: [/^\/__.*$/], // Exclude Vite dev server routes
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3004, // Use port 3004 for React development
    open: true
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600, // Increase from default 500 KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React + MUI together (MUST load together to avoid initialization issues)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/@mui/material') || 
              id.includes('node_modules/@mui/icons-material') ||
              id.includes('node_modules/@emotion/react') ||
              id.includes('node_modules/@emotion/styled')) {
            return 'vendor-ui';
          }
          
          // Backend infrastructure (safe to separate)
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'vendor-supabase';
          }
          
          // Services layer (your code, changes more frequently)
          if (id.includes('src/services/')) {
            return 'app-services';
          }
          
          // Transformers (can be route-specific later)
          if (id.includes('src/transformers/')) {
            return 'app-transformers';
          }
        }
      }
    }
  }
})