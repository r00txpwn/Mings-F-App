/**
 * Load .env + .env.local and capture cockpit UI screenshots (light + dark).
 * Usage: node scripts/run-cockpit-ui-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { applyQaCredentialAliases, requireQaStaffPassword } from './qa-credentials.mjs';

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

if (!requireQaStaffPassword('Cockpit UI audit')) {
  process.exit(1);
}
applyQaCredentialAliases();

process.env.PLAYWRIGHT_STAFF_URL = process.env.PLAYWRIGHT_STAFF_URL ?? 'http://127.0.0.1:4175';

const authGen = spawnSync('node', ['scripts/generate-staff-auth-state.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
if (authGen.status !== 0) process.exit(authGen.status ?? 1);

const result = spawnSync(
  'npx',
  ['playwright', 'test', '--config=playwright.cockpit-ui-audit.config.ts'],
  { cwd: root, stdio: 'inherit', shell: true, env: process.env },
);

process.exit(result.status ?? 1);
