import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseClientFactory {
  private static authClient: SupabaseClient | null = null;
  private static adminClient: SupabaseClient | null = null;

  static getAuthClient(): SupabaseClient {
    if (!SupabaseClientFactory.authClient) {
      console.log('🔧 SupabaseClientFactory: Creating auth client singleton');
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
