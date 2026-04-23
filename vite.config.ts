import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/propublica': {
        target: 'https://projects.propublica.org/nonprofits/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/propublica/, ''),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PediPlace/1.0)',
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
