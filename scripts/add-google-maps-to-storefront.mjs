/** Add VITE_GOOGLE_MAPS_API_KEY from pulled Vercel env file to linked mings-order project. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const file = process.argv[2] ?? '.env.vercel.mings-f-app';
if (!fs.existsSync(file)) {
  console.error('Usage: node scripts/add-google-maps-to-storefront.mjs <pulled-env-file>');
  process.exit(1);
}

let value = '';
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (!line.startsWith('VITE_GOOGLE_MAPS_API_KEY=')) continue;
  value = line.slice('VITE_GOOGLE_MAPS_API_KEY='.length).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  break;
}

if (!value) {
  console.error('VITE_GOOGLE_MAPS_API_KEY not found in', file);
  process.exit(1);
}

const result = spawnSync('vercel', ['env', 'add', 'VITE_GOOGLE_MAPS_API_KEY', 'production', '--value', value, '--yes'], {
  encoding: 'utf8',
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
if (result.status !== 0 && !out.includes('already exists')) {
  console.error(out);
  process.exit(result.status ?? 1);
}
console.log('VITE_GOOGLE_MAPS_API_KEY ensured on mings-order (production)');
