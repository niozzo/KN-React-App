/**
 * Supabase Client Service
 * 
 * Implements singleton pattern to prevent multiple GoTrueClient instances
 * and provides centralized Supabase client management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  key: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
      detectSessionInUrl?: boolean;
    };
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  session: any | null;
  hasAuthenticatedClient: boolean;
}

class SupabaseClientService {
  private static instance: SupabaseClientService;
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig | null = null;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    session: null,
    hasAuthenticatedClient: false
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SupabaseClientService {
    if (!SupabaseClientService.instance) {
      SupabaseClientService.instance = new SupabaseClientService();
    }
    return SupabaseClientService.instance;
  }

  /**
   * Initialize Supabase client with configuration
   */
  public initialize(config: SupabaseConfig): void {
    if (this.client) {
      console.warn('⚠️ Supabase client already initialized. Reinitializing...');
    }

    this.config = config;
    this.client = createClient(config.url, config.key, config.options);
    
    // Set up auth state change listener
    this.client.auth.onAuthStateChange((event, session) => {
      this.updateAuthState(session);
    });

    console.log('✅ Supabase client initialized successfully');
  }

  /**
   * Get the Supabase client instance
   */
  public getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Authenticate with email and password
   */
  public async authenticateWithCredentials(email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }

      console.log('🔐 Attempting authentication with credentials...');
      
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Authentication failed:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Authentication successful!');
      console.log('👤 User:', data.user?.email);
      
      this.updateAuthState(data.session);
      
      return { 
        success: true, 
        user: data.user, 
        session: data.session
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Authentication error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Authenticate with access code (for the current system)
   */
  public async authenticateWithAccessCode(accessCode: string): Promise<{
    success: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }

      console.log('🔐 Attempting authentication with access code...');
      
      // For now, we'll use a mock authentication since the current system
      // uses access codes but Supabase expects email/password
      // This should be replaced with proper access code authentication
      const mockUser = {
        id: 'a02d7632-590f-4919-8def-63707244cdbd',
        email: 'dave.burgess@example.com',
        user_metadata: {
          name: 'Dave Burgess',
          access_code: accessCode
        }
      };

      const mockSession = {
        access_token: 'mock_token_' + accessCode,
        refresh_token: 'mock_refresh_' + accessCode,
        user: mockUser
      };

      this.updateAuthState(mockSession);
      
      console.log('✅ Access code authentication successful!');
      console.log('👤 User:', mockUser.user_metadata.name);
      
      return { 
        success: true, 
        user: mockUser, 
        session: mockSession
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Access code authentication error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.client) {
        await this.client.auth.signOut();
      }
      
      this.authState = {
        isAuthenticated: false,
        user: null,
        session: null,
        hasAuthenticatedClient: false
      };
      
      console.log('👋 Signed out successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Sign out error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if client is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Test connection to Supabase
   */
  public async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);
      
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, data: null, error: errorMessage };
    }
  }

  /**
   * Update authentication state
   */
  private updateAuthState(session: any): void {
    this.authState = {
      isAuthenticated: !!session,
      user: session?.user || null,
      session: session,
      hasAuthenticatedClient: !!session
    };
  }

  /**
   * Get client configuration
   */
  public getConfig(): SupabaseConfig | null {
    return this.config;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    SupabaseClientService.instance = new SupabaseClientService();
  }
}

// Export singleton instance
export const supabaseClientService = SupabaseClientService.getInstance();

// Export class for testing
export { SupabaseClientService };
