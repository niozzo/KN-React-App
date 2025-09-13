/**
 * Browser-safe database configuration
 * This version doesn't use dotenv and works in the browser
 */

export const dbConfig = {
  // Supabase public API configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://iikcgdhztkrexuuqheli.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'
  }
}
