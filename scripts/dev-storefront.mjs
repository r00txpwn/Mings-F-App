/**
 * Storefront dev server — always http://127.0.0.1:5174/order
 * Kills any existing listener on 5174 before starting.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 5174;

console.log(`[dev:storefront] Freeing port ${PORT}…`);
spawnSync('node', ['scripts/kill-port.mjs', String(PORT)], { cwd: root, stdio: 'inherit', shell: true });

console.log(`[dev:storefront] Starting at http://${HOST}:${PORT}/order`);
const dev = spawnSync(
  'npx',
  [
    'vite',
    '--mode',
    'storefront',
    '--open',
    '/order',
    '--host',
    HOST,
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

process.exit(dev.status ?? 1);
