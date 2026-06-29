/**
 * Runs Supabase CLI: prefers repo-local tools/supabase(.exe), else npx supabase@latest.
 * Usage: node scripts/run-supabase-cli.mjs db push
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-supabase-cli.mjs <supabase-args...>');
  process.exit(1);
}

const localName = process.platform === 'win32' ? 'supabase.exe' : 'supabase';
const localPath = path.join(root, 'tools', localName);

let cmd;
let spawnArgs;

if (fs.existsSync(localPath)) {
  cmd = localPath;
  spawnArgs = args;
} else {
  cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  spawnArgs = ['--yes', 'supabase@latest', ...args];
}

const result = spawnSync(cmd, spawnArgs, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
