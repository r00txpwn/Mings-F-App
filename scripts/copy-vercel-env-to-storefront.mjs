/**
 * Copy storefront-safe env vars from a pulled Vercel env file into mings-order.
 * Usage: node scripts/copy-vercel-env-to-storefront.mjs .env.vercel.mings-f-app
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const sourcePath = process.argv[2];
if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error('Usage: node scripts/copy-vercel-env-to-storefront.mjs <pulled-env-file>');
  process.exit(1);
}

const ALLOW = new Set([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SURFACE_ORDER_HOSTS',
  'VITE_GOOGLE_MAPS_API_KEY',
]);

const vars = {};
for (const line of fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (ALLOW.has(key) && val) vars[key] = val;
}

if (!vars.VITE_SURFACE_ORDER_HOSTS) {
  vars.VITE_SURFACE_ORDER_HOSTS = 'order.mings.az';
}

for (const [key, value] of Object.entries(vars)) {
  const result = spawnSync('vercel', ['env', 'add', key, 'production', '--value', value, '--yes'], {
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0 && !out.includes('already exists')) {
    console.error(`Failed to add ${key} (production): ${out.slice(0, 200)}`);
    process.exit(result.status ?? 1);
  }
  console.log(`Ensured ${key} (production)`);
}

console.log('Storefront env copy complete.');
