import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Use different port from the Python server
    open: true
  },
  build: {
    outDir: 'dist'
  }
})