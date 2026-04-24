/**
 * Writes dist/build-meta.json after `vite build` so local preview QA can confirm
 * the served bundle matches the workspace (git SHA + build time).
 * Invoked from `npm run deploy:local` after `npm run build`.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const outFile = path.join(distDir, 'build-meta.json');

if (!existsSync(distDir)) {
  console.error('[write-build-meta] dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

let gitSha = null;
try {
  gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: root }).trim() || null;
} catch {
  // Not a git checkout or git unavailable — still emit timestamp-only meta.
}

const meta = {
  builtAt: new Date().toISOString(),
  gitSha,
};

writeFileSync(outFile, `${JSON.stringify(meta, null, 2)}\n`);
console.log(`[write-build-meta] Wrote ${path.relative(root, outFile)}`, meta);
