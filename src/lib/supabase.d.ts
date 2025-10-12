/**
 * Type declarations for supabase.js
 * 
 * This file provides TypeScript type information for the JavaScript
 * supabase module, ensuring type safety across the TS/JS boundary.
 */

declare module '../lib/supabase' {
  import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';

  /**
   * Configured Supabase client instance (singleton)
   */
  export const supabase: SupabaseClient;

  /**
   * Authenticate with email and password
   */
  export function authenticateWithCredentials(
    email: string,
    password: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
  }>;

  /**
   * Get the authenticated Supabase client
   */
  export function getAuthenticatedClient(): SupabaseClient;

  /**
   * Get current authentication status
   */
  export function getAuthStatus(): {
    isAuthenticated: boolean;
    user: User | null;
    session: Session | null;
  };

  /**
   * Sign out the current user
   */
  export function signOut(): Promise<{ error: AuthError | null }>;

  /**
   * Test database connection
   */
  export function testConnection(): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Authenticate with access code
   */
  export function authenticateWithAccessCode(
    accessCode: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }>;
}

