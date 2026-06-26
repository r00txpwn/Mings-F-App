/**
 * Storefront local production preview — always http://127.0.0.1:4176/
 * Kills any existing listener on 4176, builds dist-storefront, then vite preview --strictPort.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 4176;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`[deploy:local:storefront] Freeing port ${PORT}…`);
run('node', ['scripts/kill-port.mjs', String(PORT)]);

run('npm', ['run', 'verify-env']);
run('npm', ['run', 'build:storefront']);

console.log(`[deploy:local:storefront] Starting preview at http://${HOST}:${PORT}/`);
const preview = spawnSync(
  'npx',
  [
    'vite',
    'preview',
    '--mode',
    'storefront',
    '--outDir',
    'dist-storefront',
    '--host',
    HOST,
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

process.exit(preview.status ?? 1);
