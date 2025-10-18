import { Workbox } from 'workbox-window';

class PWAService {
  private workbox: Workbox | null = null;
  private isInstalled = false;
  private isFirstRegistration = true;

  constructor() {
    this.initializeWorkbox();
    this.checkInstallationStatus();
  }

  private async initializeWorkbox() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.addEventListener) {
      // Check if service worker already exists
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.isFirstRegistration = false;
        }
      } catch (error) {
        console.warn('Failed to check service worker registration:', error);
      }

      this.workbox = new Workbox('/sw.js');
      
      this.workbox.addEventListener('waiting', () => {
        console.log('🔄 New version detected - will reload automatically');
      });

      this.workbox.addEventListener('controlling', () => {
        if (this.isFirstRegistration) {
          console.log('✅ Service worker registered successfully - no reload needed');
          this.isFirstRegistration = false;
          return; // Don't reload on first registration
        }
        
        // Real update - reload automatically
        console.log('🔄 New version active - reloading automatically...');
        window.location.reload();
      });

      this.workbox.register();
    }
  }

  private checkInstallationStatus() {
    // Check if app is running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  // Removed showUpdateAvailable - updates are now automatic

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public async checkForUpdates(): Promise<boolean> {
    if (!this.workbox) return false;
    
    try {
      await this.workbox.update();
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  public async skipWaiting(): Promise<void> {
    if (this.workbox) {
      this.workbox.messageSkipWaiting();
    }
  }
}

export const pwaService = new PWAService();
export default pwaService;
