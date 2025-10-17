import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/design-tokens.css'
import './styles/components.css'
import { ServiceRegistry } from './services/ServiceRegistry'
// ServiceWorkerCacheManager removed - using simplified cache approach
import { CompanyNormalizationService } from './services/companyNormalizationService'

async function bootstrapApplication() {
  try {
    console.log('🚀 Bootstrap: Starting application initialization...');
    
    // ✅ SIMPLIFIED: No logout flags to reset with simplified cache approach
    
    // Initialize service registry first
    const serviceRegistry = ServiceRegistry.getInstance();
    serviceRegistry.initialize();

    // ✅ DISABLED: CompanyNormalizationService during bootstrap
    // This was causing sync operations before authentication
    // Company normalization will be handled after authentication
    console.log('⏸️ CompanyNormalizationService: Skipped during bootstrap - will initialize after authentication')

    // ✅ SIMPLIFIED: Service worker handles caching automatically

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