import { Workbox } from 'workbox-window';

class PWAService {
  private workbox: Workbox | null = null;
  private isInstalled = false;

  constructor() {
    this.initializeWorkbox();
    this.checkInstallationStatus();
  }

  private initializeWorkbox() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      
      this.workbox.addEventListener('waiting', () => {
        this.showUpdateAvailable();
      });

      this.workbox.addEventListener('controlling', () => {
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

  private showUpdateAvailable() {
    if (confirm('A new version is available. Would you like to update?')) {
      this.workbox?.addEventListener('controlling', () => {
        window.location.reload();
      });
      this.workbox?.messageSkipWaiting();
    }
  }

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
