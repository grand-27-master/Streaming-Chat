import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: false
        // No special buffering settings needed locally, but this shape
        // avoids some common SSE issues with proxies that try to upgrade/ws.
      }
    }
  }
})
