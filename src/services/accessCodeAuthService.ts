/**
 * AccessCodeAuthService - Authentication using access_code field
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { attendeeService } from './attendeeService';
import { 
  AccessCodeAuthRequest, 
  AccessCodeAuthResponse, 
  AuthSession, 
  AccessCodeAuthService as IAccessCodeAuthService 
} from '../types/database';

export class AccessCodeAuthService implements IAccessCodeAuthService {
  private currentSession: AuthSession | null = null;
  private readonly SESSION_KEY = 'kn_auth_session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Clear current session (for testing)
   */
  public clearCurrentSession(): void {
    this.currentSession = null;
  }

  /**
   * Authenticate user with access code
   */
  async authenticateWithAccessCode(accessCode: string): Promise<AccessCodeAuthResponse> {
    try {
      console.log('🔐 Attempting authentication with access code:', accessCode);

      // Validate access code format
      if (!this.validateAccessCode(accessCode)) {
        return {
          success: false,
          error: 'Invalid access code format. Must be 6 digits.',
          attendee: undefined
        };
      }

      // Look up attendee by access code
      const response = await attendeeService.getAttendeeByAccessCode(accessCode);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Access code not found',
          attendee: undefined
        };
      }

      // Create session
      const session: AuthSession = {
        attendee: response.data,
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString()
      };

      // Store session
      this.currentSession = session;
      this.saveSessionToStorage(session);

      console.log('✅ Authentication successful!');
      console.log('👤 User:', response.data.first_name, response.data.last_name);

      return {
        success: true,
        attendee: response.data,
        error: undefined
      };

    } catch (err) {
      console.error('❌ Authentication error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        attendee: undefined
      };
    }
  }

  /**
   * Validate access code format
   */
  validateAccessCode(accessCode: string): boolean {
    // Access codes are 6-digit strings
    return /^\d{6}$/.test(accessCode);
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      // Check if we have a current session in memory
      if (this.currentSession && this.isSessionValid(this.currentSession)) {
        return this.currentSession;
      }

      // Try to load from storage
      const storedSession = this.loadSessionFromStorage();
      if (storedSession && this.isSessionValid(storedSession)) {
        this.currentSession = storedSession;
        return storedSession;
      }

      // Session is invalid or expired
      this.clearSession();
      return null;

    } catch (err) {
      console.error('❌ Error getting current session:', err);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<boolean> {
    try {
      this.clearSession();
      console.log('👋 Signed out successfully');
      return true;
    } catch (err) {
      console.error('❌ Sign out error:', err);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  /**
   * Get current attendee
   */
  async getCurrentAttendee() {
    const session = await this.getCurrentSession();
    return session?.attendee || null;
  }

  /**
   * Refresh session if needed
   */
  async refreshSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session) {
        return false;
      }

      // Check if session is close to expiring (within 1 hour)
      const expirationTime = new Date(session.expiresAt).getTime();
      const oneHourFromNow = Date.now() + (60 * 60 * 1000);
      
      if (expirationTime < oneHourFromNow) {
        // Refresh the session
        const newSession: AuthSession = {
          ...session,
          expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString()
        };
        
        this.currentSession = newSession;
        this.saveSessionToStorage(newSession);
        return true;
      }

      return true;
    } catch (err) {
      console.error('❌ Error refreshing session:', err);
      return false;
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthSession): boolean {
    if (!session || !session.isAuthenticated) {
      return false;
    }

    const now = Date.now();
    const expirationTime = new Date(session.expiresAt).getTime();
    
    return expirationTime > now;
  }

  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(session: AuthSession): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      console.error('❌ Error saving session to storage:', err);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSessionFromStorage(): AuthSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) {
        return null;
      }
      
      return JSON.parse(stored) as AuthSession;
    } catch (err) {
      console.error('❌ Error loading session from storage:', err);
      return null;
    }
  }

  /**
   * Clear session from memory and storage
   */
  private clearSession(): void {
    this.currentSession = null;
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (err) {
      console.error('❌ Error clearing session from storage:', err);
    }
  }

  /**
   * Get session expiration time
   */
  getSessionExpiration(): Date | null {
    if (!this.currentSession) {
      return null;
    }
    
    return new Date(this.currentSession.expiresAt);
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeUntilExpiration(): number {
    const expiration = this.getSessionExpiration();
    if (!expiration) {
      return 0;
    }
    
    return Math.max(0, expiration.getTime() - Date.now());
  }
}

// Export singleton instance
export const accessCodeAuthService = new AccessCodeAuthService();
