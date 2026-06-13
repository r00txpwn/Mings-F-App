/**
 * Renames mode-specific HTML entry to index.html for static hosts (Vercel/Netlify).
 * Usage: node scripts/prepare-dist-output.mjs staff|storefront
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2]?.trim();

if (target !== 'staff' && target !== 'storefront') {
  console.error('[prepare-dist-output] Usage: node scripts/prepare-dist-output.mjs staff|storefront');
  process.exit(1);
}

const distDir = path.join(root, target === 'staff' ? 'dist-staff' : 'dist-storefront');
const srcName = target === 'staff' ? 'index-staff.html' : 'index-storefront.html';
const src = path.join(distDir, srcName);
const dest = path.join(distDir, 'index.html');

if (!existsSync(src)) {
  console.error(`[prepare-dist-output] Missing ${srcName} in ${path.basename(distDir)}/`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`[prepare-dist-output] ${path.relative(root, src)} → ${path.relative(root, dest)}`);
