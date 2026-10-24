import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Real backend (used when USE_MOCK = false in src/services/api.js).
      // 127.0.0.1, not localhost: on Windows "localhost" tries IPv6 first and adds ~200 ms per request.
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
