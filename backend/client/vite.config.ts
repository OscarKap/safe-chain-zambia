import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to backend (adjust port if needed)
      '/auth': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/dashboard': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/api': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
    },
  },
});