import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Local production preview: always the same port (fails fast if 4173 is taken)
  preview: {
    port: 4173,
    strictPort: true,
    host: '127.0.0.1',
  },
});
