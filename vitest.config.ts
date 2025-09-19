/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Conference Companion',
        short_name: 'ConfComp',
        description: 'Executive conference companion app for seamless event management',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
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
    port: 3004,
    open: true
  },
  build: {
    outDir: 'dist'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    teardownFiles: ['./src/__tests__/teardown.ts'],
    include: [
      'src/__tests__/**/*.{test,spec}.{js,ts,tsx}'
    ],
    // Memory optimization settings - Use forks for better isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 2,
        minForks: 1
      }
    },
    // Limit concurrency to prevent hanging
    maxConcurrency: 2,
    // Test isolation
    isolate: true,
    // Shorter timeouts to prevent hanging
    testTimeout: 5000,
    hookTimeout: 5000,
    // Add bail to stop on first failure
    bail: 10,
    // Performance optimizations
    silent: true,
    reporter: ['default'],
    // Suppress console output during tests
    onConsoleLog(log, type) {
      if (type === 'stderr' && log.includes('Multiple GoTrueClient instances')) {
        return false; // Suppress Supabase warnings
      }
      if (log.includes('🔍') || log.includes('🔄') || log.includes('❌') || log.includes('⚠️')) {
        return false; // Suppress verbose service logging
      }
      // Suppress massive HTML dumps from LoginPage tests
      if (log.includes('Here are the accessible roles:') || 
          log.includes('Ignored nodes: comments, script, style') ||
          log.includes('Name "KnowledgeNow 2025"') ||
          log.includes('Name "Enter your 6-character access code"')) {
        return false;
      }
      return true;
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 85,
          statements: 85
        }
      }
    }
  }
})
