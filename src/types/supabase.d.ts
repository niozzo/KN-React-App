/**
 * Type declarations for Supabase client
 */

declare module '../../lib/supabase.js' {
  export const supabase: {
    from: (table: string) => {
      select: (columns?: string) => {
        eq: (column: string, value: any) => {
          single: () => Promise<{ data: any; error: any }>
        }
        order: (column: string, options?: { ascending?: boolean }) => {
          order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: any; error: any }>
        }
        in: (column: string, values: any[]) => {
          order: (column: string, options?: { ascending?: boolean }) => {
            order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: any; error: any }>
          }
        }
        limit: (count: number) => Promise<{ data: any; error: any }>
      }
    }
  }
}
