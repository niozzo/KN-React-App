export class ServiceWorkerCacheManager {
  private static instance: ServiceWorkerCacheManager;
  private serviceWorker: ServiceWorker | null = null;

  static getInstance(): ServiceWorkerCacheManager {
    if (!ServiceWorkerCacheManager.instance) {
      ServiceWorkerCacheManager.instance = new ServiceWorkerCacheManager();
    }
    return ServiceWorkerCacheManager.instance;
  }

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorker = await navigator.serviceWorker.ready;
        console.log('✅ ServiceWorkerCacheManager: Service worker ready');
      } catch (error) {
        console.warn('⚠️ ServiceWorkerCacheManager: Service worker not available:', error);
      }
    } else {
      console.warn('⚠️ ServiceWorkerCacheManager: Service worker not supported');
    }
  }

  async cacheData(tableName: string, data: any): Promise<void> {
    if (!this.serviceWorker) {
      console.warn('⚠️ ServiceWorkerCacheManager: Service worker not available for caching');
      return;
    }

    try {
      await this.serviceWorker.postMessage({
        type: 'CACHE_DATA',
        payload: { tableName, data }
      });
      console.log(`✅ ServiceWorkerCacheManager: Cached data for ${tableName}`);
    } catch (error) {
      console.error('❌ ServiceWorkerCacheManager: Failed to cache data:', error);
    }
  }

  async getCachedData(tableName: string): Promise<any> {
    if (!this.serviceWorker) {
      console.warn('⚠️ ServiceWorkerCacheManager: Service worker not available for retrieval');
      return null;
    }

    try {
      const response = await this.serviceWorker.postMessage({
        type: 'GET_CACHED_DATA',
        payload: { tableName }
      });
      return response;
    } catch (error) {
      console.error('❌ ServiceWorkerCacheManager: Failed to get cached data:', error);
      return null;
    }
  }
}
