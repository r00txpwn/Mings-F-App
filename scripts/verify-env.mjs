/**
 * Verifies required VITE_* vars exist in .env without printing secret values.
 * Usage: node scripts/verify-env.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const optional = [
  'VITE_KIOSK_SECRET',
  'VITE_KDS_SECRET',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_ADMIN_APP_PATH',
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

if (!fs.existsSync(envPath)) {
  console.error('Missing .env — copy .env.example to .env and set values.');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
let ok = true;

console.log('Environment check (.env present, values not shown):\n');

for (const key of required) {
  const v = env[key];
  const status = v ? 'ok' : 'MISSING';
  console.log(`  ${key}: ${status}`);
  if (!v) ok = false;
}

for (const key of optional) {
  const v = env[key];
  console.log(`  ${key}: ${v ? 'set' : '(optional, empty)'}`);
}

if (!ok) {
  console.error('\nFix .env using .env.example as a template.');
  process.exit(1);
}

console.log('\nRequired variables are set.');
process.exit(0);
