import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // IMPORTANT: more specific paths must be listed BEFORE the general
      // '/api' catch-all below, since Vite/http-proxy-middleware matches
      // in the order these keys are defined.

      // auth-service — accounts/login/credentials
      '/api/v1/accounts': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/v1/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },

      // core-services — everything else (employees, branches, container
      // prices, sales reports, attendance, expenses)
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})