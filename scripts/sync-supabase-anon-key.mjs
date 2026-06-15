/** Sync VITE_SUPABASE_ANON_KEY in .env from Supabase MCP output (stdin JSON). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const anonKey = process.argv[2];
if (!anonKey || anonKey.length < 20) {
  console.error('Usage: node scripts/sync-supabase-anon-key.mjs <anon_jwt>');
  process.exit(1);
}

for (const file of ['.env', '.env.local']) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  if (!/^VITE_SUPABASE_ANON_KEY=/m.test(text)) continue;
  const next = text.replace(/^VITE_SUPABASE_ANON_KEY=.*$/m, `VITE_SUPABASE_ANON_KEY=${anonKey}`);
  if (next !== text) {
    fs.writeFileSync(p, next, 'utf8');
    console.log(`${file}: updated VITE_SUPABASE_ANON_KEY`);
  } else {
    console.log(`${file}: already matches`);
  }
}
