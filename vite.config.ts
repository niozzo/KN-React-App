import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004, // Use port 3004 for React development
    open: true
  },
  build: {
    outDir: 'dist'
  }
})