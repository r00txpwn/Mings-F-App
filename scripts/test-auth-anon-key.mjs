/**
 * Smoke-test VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY against Auth settings endpoint.
 * Usage: node scripts/test-auth-anon-key.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[trimmed.slice(0, eq).trim()] = val;
  }
  return out;
}

const env = { ...parseEnv(path.join(root, '.env')), ...parseEnv(path.join(root, '.env.local')) };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
let keyRef = '';
try {
  keyRef = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).ref ?? '';
} catch {
  keyRef = 'decode_failed';
}

const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

console.log(
  JSON.stringify(
    {
      urlRef: ref ?? null,
      keyRef,
      refsMatch: ref === keyRef,
      authSettingsStatus: res.status,
      ok: res.ok,
    },
    null,
    2
  )
);

process.exit(res.ok ? 0 : 1);
