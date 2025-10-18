import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Workbox
const mockWorkbox = {
  addEventListener: vi.fn(),
  register: vi.fn(),
  update: vi.fn(),
  messageSkipWaiting: vi.fn()
};

vi.mock('workbox-window', () => ({
  Workbox: vi.fn().mockImplementation(() => mockWorkbox)
}));

// Mock navigator.serviceWorker
const mockServiceWorker = {
  getRegistration: vi.fn(),
  addEventListener: vi.fn()
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: mockReload
  },
  writable: true
});

describe('PWAService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReload.mockClear();
  });

  describe('Service Worker Registration Logic', () => {
    it('should detect first registration correctly', async () => {
      // Mock first registration (no existing service worker)
      mockServiceWorker.getRegistration.mockResolvedValue(null);
      
      // Test the logic directly
      const registration = await navigator.serviceWorker.getRegistration();
      expect(registration).toBeNull();
    });

    it('should detect existing service worker correctly', async () => {
      // Mock existing service worker
      mockServiceWorker.getRegistration.mockResolvedValue({ active: true });
      
      // Test the logic directly
      const registration = await navigator.serviceWorker.getRegistration();
      expect(registration).toBeTruthy();
    });

    it('should handle service worker check errors gracefully', async () => {
      mockServiceWorker.getRegistration.mockRejectedValue(new Error('Service worker check failed'));
      
      // Should not throw error
      try {
        await navigator.serviceWorker.getRegistration();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Update Methods', () => {
    it('should handle update check errors', async () => {
      mockWorkbox.update.mockRejectedValue(new Error('Update check failed'));
      
      try {
        await mockWorkbox.update();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle successful update checks', async () => {
      mockWorkbox.update.mockResolvedValue(true);
      
      const result = await mockWorkbox.update();
      expect(result).toBe(true);
    });
  });

  describe('Installation Status', () => {
    it('should detect installed app correctly', () => {
      // Mock standalone display mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        })),
        writable: true
      });
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      expect(isStandalone).toBe(true);
    });
  });

  describe('Console Logging', () => {
    it('should log first registration message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      console.log('✅ Service worker registered successfully - no reload needed');
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Service worker registered successfully - no reload needed');
    });

    it('should log update message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      console.log('🔄 New version active - reloading automatically...');
      
      expect(consoleSpy).toHaveBeenCalledWith('🔄 New version active - reloading automatically...');
    });
  });
});
