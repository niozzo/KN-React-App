// Database configuration for direct PostgreSQL connection
// This file now uses environment variables for security

import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

export const dbConfig = {
  // Supabase public API configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikcgdhztkrexuuqheli.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'
  },
  
  // Direct PostgreSQL connection configuration
  // Uses environment variables for security
  direct: {
    host: process.env.DB_HOST || 'db.iikcgdhztkrexuuqheli.supabase.co',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'your_database_username',
    password: process.env.DB_PASSWORD || 'your_database_password',
    ssl: {
      rejectUnauthorized: false
    },
    // Connection pool settings
    max: 5, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  }
}

// Connection string for direct PostgreSQL access
export const getConnectionString = () => {
  const { host, port, database, user, password } = dbConfig.direct
  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`
}
