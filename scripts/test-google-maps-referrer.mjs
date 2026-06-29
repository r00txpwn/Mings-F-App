/** Test whether Maps JS API accepts a referrer (does not print the API key). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const referer = process.argv[2] ?? 'https://order.mings.az/';

function readKey() {
  for (const file of [path.join(root, '.env'), path.join(root, '.env.local')]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line.startsWith('VITE_GOOGLE_MAPS_API_KEY=')) continue;
      let val = line.slice('VITE_GOOGLE_MAPS_API_KEY='.length).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val) return val;
    }
  }
  return '';
}

const key = readKey();
if (!key) {
  console.error('No VITE_GOOGLE_MAPS_API_KEY in .env');
  process.exit(1);
}

const url = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
const res = await fetch(url, { headers: { Referer: referer } });
const text = await res.text();
const ok = res.ok && !text.includes('RefererNotAllowedMapError') && !text.includes('ApiNotActivatedMapError');
console.log(JSON.stringify({
  referer,
  status: res.status,
  ok,
  hint: text.includes('RefererNotAllowedMapError')
    ? 'RefererNotAllowedMapError — add this referrer in GCP'
    : text.includes('ApiNotActivatedMapError')
      ? 'ApiNotActivatedMapError — enable Maps JavaScript API'
      : ok
        ? 'Maps JS endpoint accepted this referrer'
        : 'Unexpected response — check GCP key restrictions',
}, null, 2));
