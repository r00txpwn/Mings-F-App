/**
 * Load .env + .env.local (including STAFF_PASSWORD) and run Expenses CRUD e2e.
 * Usage: node scripts/run-expenses-crud-e2e.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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

const merged = {
  ...parseEnv(path.join(root, '.env')),
  ...parseEnv(path.join(root, '.env.local')),
};

for (const [key, val] of Object.entries(merged)) {
  if (val !== undefined && val !== '') process.env[key] = val;
}

if (!process.env.STAFF_PASSWORD?.trim()) {
  console.error('STAFF_PASSWORD missing in .env.local');
  process.exit(1);
}

process.env.PLAYWRIGHT_STAFF_URL = process.env.PLAYWRIGHT_STAFF_URL ?? 'http://127.0.0.1:4175';

const result = spawnSync(
  'npx',
  ['playwright', 'test', '--project=staff-auth-setup', '--project=expenses-crud'],
  { cwd: root, stdio: 'inherit', shell: true, env: process.env },
);

process.exit(result.status ?? 1);
