import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, '.env.local');
if (!fs.existsSync(file)) {
  console.log('missing .env.local');
  process.exit(1);
}
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (!line.startsWith('VITE_GOOGLE_MAPS_API_KEY=')) continue;
  let val = line.slice('VITE_GOOGLE_MAPS_API_KEY='.length).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  console.log(val ? 'local-set' : 'local-empty');
  process.exit(0);
}
console.log('local-missing');
