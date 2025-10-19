/**
 * OfflineAwareImageService - Centralized image loading with offline fallbacks
 * Handles offline-aware image loading for attendee headshots, company logos, and other assets
 */

export class OfflineAwareImageService {
  private static instance: OfflineAwareImageService;
  
  static getInstance(): OfflineAwareImageService {
    if (!OfflineAwareImageService.instance) {
      OfflineAwareImageService.instance = new OfflineAwareImageService();
    }
    return OfflineAwareImageService.instance;
  }
  
  /**
   * Get image URL with offline fallback
   * @param originalUrl - Original image URL
   * @param fallbackUrl - Fallback image URL when offline
   * @returns Image URL (original if online, fallback if offline)
   */
  getImageUrl(originalUrl: string, fallbackUrl?: string): string {
    if (!navigator.onLine) {
      console.log('📱 Offline mode: Using fallback image');
      return fallbackUrl || '/assets/placeholder-avatar.png';
    }
    return originalUrl;
  }
  
  /**
   * Get attendee headshot URL with offline fallback and Supabase image optimization
   * @param attendeeId - Attendee ID
   * @param photoUrl - Optional photo URL from attendee data
   * @param width - Desired width (default: 80)
   * @param height - Desired height (default: 80)
   * @param quality - Image quality 20-100 (default: 80)
   * @returns Optimized headshot URL with offline fallback
   */
  getHeadshotUrl(attendeeId: string, photoUrl?: string, width: number = 80, height: number = 80, quality: number = 80): string {
    // If we have a photo URL, use it with offline fallback
    if (photoUrl) {
      return this.getImageUrl(photoUrl, '/assets/placeholder-avatar.png');
    }
    
    // Generate optimized Supabase storage URL with transformations
    const baseUrl = `https://iikcgdhztkrexuuqheli.supabase.co/storage/v1/render/image/public/attendee-headshots/${attendeeId}`;
    const optimizedUrl = `${baseUrl}?width=${width}&height=${height}&quality=${quality}&resize=cover`;
    return this.getImageUrl(optimizedUrl, '/assets/placeholder-avatar.png');
  }
  
  /**
   * Get company logo URL with offline fallback and Supabase image optimization
   * @param companyId - Company ID
   * @param logoUrl - Optional logo URL from company data
   * @param width - Desired width (default: 120)
   * @param height - Desired height (default: 60)
   * @param quality - Image quality 20-100 (default: 85)
   * @returns Optimized logo URL with offline fallback
   */
  getLogoUrl(companyId: string, logoUrl?: string, width: number = 120, height: number = 60, quality: number = 85): string {
    // If we have a logo URL, use it with offline fallback
    if (logoUrl) {
      return this.getImageUrl(logoUrl, '/assets/placeholder-logo.png');
    }
    
    // Generate optimized Supabase storage URL with transformations
    const baseUrl = `https://iikcgdhztkrexuuqheli.supabase.co/storage/v1/render/image/public/company-logos/${companyId}`;
    const optimizedUrl = `${baseUrl}?width=${width}&height=${height}&quality=${quality}&resize=contain`;
    return this.getImageUrl(optimizedUrl, '/assets/placeholder-logo.png');
  }
  
  /**
   * Get sponsor logo URL with offline fallback and Supabase image optimization
   * @param sponsor - Sponsor object with logo and name
   * @param width - Desired width (default: 150)
   * @param height - Desired height (default: 75)
   * @param quality - Image quality 20-100 (default: 85)
   * @returns Optimized logo URL with offline fallback
   */
  getSponsorLogoUrl(sponsor: any, width: number = 150, height: number = 75, quality: number = 85): string {
    // If we have a logo URL, use it with offline fallback
    if (sponsor.logo && sponsor.logo.trim()) {
      return this.getImageUrl(sponsor.logo, '/assets/placeholder-logo.png');
    }
    
    // Generate Clearbit fallback URL (already optimized)
    const domainPart = sponsor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clearbitUrl = `https://logo.clearbit.com/${domainPart}.com`;
    return this.getImageUrl(clearbitUrl, '/assets/placeholder-logo.png');
  }
  
  /**
   * Check if we're currently offline
   * @returns True if offline, false if online
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }
  
  /**
   * Get offline status message
   * @returns Status message for offline state
   */
  getOfflineStatusMessage(): string {
    return this.isOffline() ? '📱 Offline mode: Using cached data and fallback images' : '🌐 Online: Loading fresh images';
  }
}

// Export singleton instance
export const offlineAwareImageService = OfflineAwareImageService.getInstance();
