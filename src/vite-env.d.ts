/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPLICATION_DB_URL: string
  readonly VITE_APPLICATION_DB_ANON_KEY: string
  readonly VITE_APPLICATION_DB_SERVICE_KEY?: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
