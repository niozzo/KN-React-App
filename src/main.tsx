import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/design-tokens.css'
import './styles/components.css'
import { ServiceRegistry } from './services/ServiceRegistry'
import { ServiceWorkerCacheManager } from './services/ServiceWorkerCacheManager'

async function bootstrapApplication() {
  try {
    console.log('🚀 Bootstrap: Starting application initialization...');
    
    // Initialize service registry first
    const serviceRegistry = ServiceRegistry.getInstance();
    serviceRegistry.initialize();

    // Initialize service worker cache manager
    const cacheManager = ServiceWorkerCacheManager.getInstance();
    await cacheManager.initialize();

    console.log('✅ Bootstrap: Application services initialized successfully');

    // Start React application
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('❌ Bootstrap: Failed to initialize application:', error);
    // Fallback: Start React app anyway
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  }
}

bootstrapApplication();