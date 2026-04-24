import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Align with `npm run deploy:local` (4175) so plain `vite preview` / `npm run preview` is not stuck on 4173.
  preview: {
    port: 4175,
    strictPort: true,
    host: '127.0.0.1',
  },
});
