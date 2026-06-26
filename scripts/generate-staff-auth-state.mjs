/**
 * Build Playwright storageState with a valid staff Supabase session (bypasses flaky form login).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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

const env = {
  ...parseEnv(path.join(root, '.env')),
  ...parseEnv(path.join(root, '.env.local')),
};

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const email = env.STAFF_EMAIL?.trim() || 'staff@mings.az';
const password = env.STAFF_PASSWORD?.trim();
const origin = env.PLAYWRIGHT_STAFF_URL?.trim() || 'http://127.0.0.1:4175';

if (!url || !anonKey || !password) {
  console.error('Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, STAFF_PASSWORD in .env.local');
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error || !data.session) {
  console.error('Staff sign-in failed:', error?.message ?? 'no session');
  process.exit(1);
}

const authPayload = JSON.stringify({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
  expires_at: data.session.expires_at,
  expires_in: data.session.expires_in,
  token_type: data.session.token_type,
  user: data.session.user,
});

const outPath = path.join(root, 'docs', 'qa-screenshots', '.auth', 'staff-auth-state.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      cookies: [],
      origins: [
        {
          origin,
          localStorage: [
            { name: 'mings-staff-auth', value: authPayload },
            { name: 'theme', value: 'dark' },
          ],
        },
      ],
    },
    null,
    2,
  ),
);

console.log('[staff-auth-state] Wrote', outPath);
