/**
 * Staff dev server — always http://127.0.0.1:5173/ (cockpit at /spec-ops)
 * Kills any existing listener on 5173 before starting.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 5173;

console.log(`[dev:staff] Freeing port ${PORT}…`);
spawnSync('node', ['scripts/kill-port.mjs', String(PORT)], { cwd: root, stdio: 'inherit', shell: true });

console.log(`[dev:staff] Starting at http://${HOST}:${PORT}/spec-ops`);
const dev = spawnSync(
  'npx',
  [
    'vite',
    '--mode',
    'staff',
    '--open',
    '/spec-ops',
    '--host',
    HOST,
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

process.exit(dev.status ?? 1);
