/**
 * DUAL DATABASE ARCHITECTURE NOTICE:
 * This factory creates clients for the EXTERNAL database only.
 * The APPLICATION database is managed by ServiceRegistry.
 * 
 * Multiple GoTrueClient instances are EXPECTED due to:
 * - Different database URLs
 * - Different storage keys
 * - Different authentication contexts
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseClientFactory {
  private static authClient: SupabaseClient | null = null;
  private static adminClient: SupabaseClient | null = null;

  static getAuthClient(): SupabaseClient {
    if (!SupabaseClientFactory.authClient) {
      console.log('🔧 SupabaseClientFactory: Creating EXTERNAL database client');
      console.log('🏗️ This is expected - different from Application database client');
      SupabaseClientFactory.authClient = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );
    }
    return SupabaseClientFactory.authClient;
  }

  static getAdminClient(): SupabaseClient {
    if (!SupabaseClientFactory.adminClient) {
      console.log('🔧 SupabaseClientFactory: Creating admin client singleton');
      SupabaseClientFactory.adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return SupabaseClientFactory.adminClient;
  }

  static reset(): void {
    console.log('🔄 SupabaseClientFactory: Resetting clients');
    SupabaseClientFactory.authClient = null;
    SupabaseClientFactory.adminClient = null;
  }
}
