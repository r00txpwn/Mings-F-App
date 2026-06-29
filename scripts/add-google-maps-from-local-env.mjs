/** Add VITE_GOOGLE_MAPS_API_KEY from repo .env to linked Vercel project (production). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseValue(file) {
  if (!fs.existsSync(file)) return '';
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.startsWith('VITE_GOOGLE_MAPS_API_KEY=')) continue;
    let val = line.slice('VITE_GOOGLE_MAPS_API_KEY='.length).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return '';
}

const value = parseValue(path.join(root, '.env')) || parseValue(path.join(root, '.env.local'));
if (!value) {
  console.error('VITE_GOOGLE_MAPS_API_KEY not found in .env or .env.local');
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
console.log('VITE_GOOGLE_MAPS_API_KEY ensured (production)');
