/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Detect test environment - Vitest sets process.env.VITEST or mode will be 'test'
  const isTestMode = mode === 'test' || process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
  
  return {
  plugins: [
    react(),
    // Disable VitePWA in test mode - service worker not needed for tests
    // This prevents file handle leaks from PWA plugin during test runs
    ...(isTestMode ? [] : [VitePWA({
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
    })])
  ],
  server: {
    port: 3004,
    open: true,
    // Force server to close file handles properly during tests
    watch: null,
    hmr: false
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src',
      // Add explicit aliases for service modules to prevent resolution issues
      '@/services': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/services',
      '@/components': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/components',
      '@/hooks': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/hooks',
      '@/contexts': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/contexts'
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    // Fix TypeScript module resolution
    conditions: ['import', 'module', 'browser', 'default'],
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    // Better module resolution for TypeScript
    preserveSymlinks: false,
    // Add explicit module resolution for services
    modules: ['node_modules', 'src'],
    // Force TypeScript file resolution in test environment
    preferRelative: false,
    // Handle TypeScript imports without extensions
    fullySpecified: false
  },
  esbuild: {
    target: 'esnext',
    // Enable TypeScript parameter properties
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/__tests__/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
      // ✅ CLEANED UP: All previously excluded files have been deleted
      // or are now running (after 77% test suite reduction)
    ],
    // Test-specific server configuration (isolated from dev server)
    server: {
      port: 0, // Use random port to avoid conflicts
      open: false, // Don't open browser in test mode
      strictPort: false, // Allow port fallback
      deps: {
        inline: ['@testing-library/jest-dom', '@testing-library/react'],
        external: ['@supabase/supabase-js']
      },
      // Force Vite server to close file handles properly during tests
      watch: null,
      hmr: false
    },
    // Add TypeScript module resolution for test environment
    resolve: {
      alias: {
        '@': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src',
        '@/services': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/services',
        '@/components': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/components',
        '@/hooks': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/hooks',
        '@/contexts': '/Users/nickiozzo/Documents/GitHub/KN-React-App/src/contexts'
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      // Enable automatic TypeScript file resolution
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx', '.jsx'],
        '.ts': ['.ts', '.tsx'],
        '.jsx': ['.jsx', '.tsx']
      },
      conditions: ['import', 'module', 'browser', 'default'],
      mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
      preserveSymlinks: false,
      modules: ['node_modules', 'src'],
      preferRelative: false,
      fullySpecified: false
    },
    // Mock modules globally
    mockReset: true,
    // Proper TypeScript support
    typecheck: {
      enabled: false // Disable typechecking in tests for performance
    },
    // Enable TypeScript compilation for tests
    esbuild: {
      target: 'esnext'
    },
    // Snapshot configuration
    snapshotFormat: {
      printBasicPrototype: false
    },
    // CRITICAL FIX: Use single thread to prevent worker process accumulation
    // Multiple worker processes (7+) were causing deadlocks and hangs
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true  // Run all tests in ONE thread sequentially
      }
    },
    // Disable file parallelism to prevent worker process buildup
    fileParallelism: false,
    // Run tests sequentially (no concurrent execution)
    maxConcurrency: 1,
    // Test isolation
    isolate: true,
    // Optimized timeouts - increased to prevent hanging
    testTimeout: 15000, // 15s per test (was 5000)
    hookTimeout: 10000, // 10s for hooks (was 5000)
    teardownTimeout: 10000, // 10s for teardown (was 5000)
    // Add bail to stop on first failure
    bail: 5, // Reduced from 10 to 5
    // Performance optimizations
    silent: false, // Temporarily enable for debugging
    reporter: ['default', 'hanging-process'], // Re-enabled for final diagnostics
    // Memory and performance optimizations
    passWithNoTests: true,
    logHeapUsage: false,
    // Force exit after tests complete
    forceRerunTriggers: ['**/package.json', '**/vitest.config.*'],
    // Mock cleanup (globals and mockReset already set above)
    clearMocks: true,
    restoreMocks: true,
    // Note: Removed onProcessExit to prevent hanging issues
    // Prevent hanging by forcing process exit and manage console output
    onConsoleLog(log, type) {
      // Allow console output for debugging
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      // Suppress only specific verbose output in production/test mode
      if (type === 'stderr' && log.includes('Multiple GoTrueClient instances')) {
        return false; // Suppress Supabase warnings
      }
      
      // Allow debug logs for testing
      if (log.includes('About to call syncAllData') || 
          log.includes('serverDataSyncService:') || 
          log.includes('Sync result:')) {
        return true; // Allow debug logs
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
          branches: 50,
          functions: 60,
          lines: 50,
          statements: 50
        },
        // Per-file thresholds for critical components
        'src/hooks/useSessionData.js': {
          branches: 70,
          functions: 65,
          lines: 75,
          statements: 75
        },
        'src/services/schemaValidationService.ts': {
          branches: 45,
          functions: 90,
          lines: 55,
          statements: 55
        },
        'src/services/attendeeInfoService.ts': {
          branches: 50,
          functions: 75,
          lines: 70,
          statements: 70
        }
      }
    }
  }
}
})
