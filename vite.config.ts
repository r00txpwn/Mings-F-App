import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function resolveBuildTarget(mode: string): 'staff' | 'storefront' {
  if (mode === 'storefront') return 'storefront';
  if (mode === 'staff') return 'staff';
  const raw = (process.env.VITE_BUILD_TARGET ?? 'staff').trim().toLowerCase();
  return raw === 'storefront' ? 'storefront' : 'staff';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const buildTarget = resolveBuildTarget(mode);
  const isStorefront = buildTarget === 'storefront';
  const outDir = isStorefront ? 'dist-storefront' : 'dist-staff';
  const prodInput = path.resolve(rootDir, isStorefront ? 'index-storefront.html' : 'index-staff.html');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_BUILD_TARGET': JSON.stringify(buildTarget),
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: prodInput,
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    preview: {
      port: isStorefront ? 4176 : 4175,
      strictPort: true,
      host: '127.0.0.1',
    },
    // Dev server always uses root index.html → main.tsx (mode selects staff vs storefront).
    ...(command === 'serve' ? { appType: 'spa' as const } : {}),
  };
});
