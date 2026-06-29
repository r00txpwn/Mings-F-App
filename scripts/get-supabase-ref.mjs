/** Prints Supabase project ref from .env.local or .env (no secrets). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function refFromFile(file) {
  if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^VITE_SUPABASE_URL=(.+)$/);
    if (!m) continue;
    let url = m[1].trim();
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1);
    }
    const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    return ref ?? null;
  }
  return null;
}

const ref = refFromFile(path.join(root, '.env.local')) ?? refFromFile(path.join(root, '.env'));
if (!ref) {
  console.error('No VITE_SUPABASE_URL found');
  process.exit(1);
}
console.log(ref);
