/**
 * Writes build-meta.json after `vite build` so local preview QA can confirm
 * the served bundle matches the workspace (git SHA + build time + target).
 *
 * Usage: node scripts/write-build-meta.mjs [dist-staff|dist-storefront|dist]
 */
import { existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distName = process.argv[2]?.trim() || 'dist-staff';
const distDir = path.join(root, distName);
const outFile = path.join(distDir, 'build-meta.json');

if (!existsSync(distDir)) {
  console.error(`[write-build-meta] ${distName}/ is missing. Run build first.`);
  process.exit(1);
}

let gitSha = null;
try {
  gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: root }).trim() || null;
} catch {
  // Not a git checkout or git unavailable — still emit timestamp-only meta.
}

const buildTarget =
  distName === 'dist-storefront' ? 'storefront' : distName === 'dist-staff' ? 'staff' : 'legacy';

const meta = {
  builtAt: new Date().toISOString(),
  gitSha,
  buildTarget,
};

writeFileSync(outFile, `${JSON.stringify(meta, null, 2)}\n`);
console.log(`[write-build-meta] Wrote ${path.relative(root, outFile)}`, meta);
