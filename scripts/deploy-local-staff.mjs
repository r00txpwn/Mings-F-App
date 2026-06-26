/**
 * Staff local production preview — always http://127.0.0.1:4175/
 * Kills any existing listener on 4175, builds dist-staff, then vite preview --strictPort.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 4175;

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`[deploy:local] Freeing port ${PORT}…`);
run('node', ['scripts/kill-port.mjs', String(PORT)]);

run('npm', ['run', 'verify-env']);
run('npm', ['run', 'build:staff']);

console.log(`[deploy:local] Starting preview at http://${HOST}:${PORT}/`);
const preview = spawnSync(
  'npx',
  [
    'vite',
    'preview',
    '--mode',
    'staff',
    '--outDir',
    'dist-staff',
    '--host',
    HOST,
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

process.exit(preview.status ?? 1);
