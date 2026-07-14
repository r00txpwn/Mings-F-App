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

const PROD_REF = 'dmrvycswdteuhfydchdr';

function readLinkedRef() {
  const refPath = path.join(root, 'supabase', '.temp', 'project-ref');
  if (!fs.existsSync(refPath)) return null;
  return fs.readFileSync(refPath, 'utf8').trim() || null;
}

function guardProdMutation() {
  const top = args[0];
  const sub = args[1];
  const isMutating =
    (top === 'db' && ['push', 'reset', 'execute'].includes(sub)) ||
    (top === 'functions' && sub === 'deploy') ||
    (top === 'migration' && ['up', 'repair'].includes(sub));
  if (!isMutating) return;

  const linked = readLinkedRef();
  if (linked !== PROD_REF) return;

  if (process.env.SUPABASE_ALLOW_PROD === '1' || args.includes('--allow-prod')) {
    console.warn('⚠️  PRODUCTION Supabase mutation allowed (SUPABASE_ALLOW_PROD=1).');
    return;
  }

  console.error('');
  console.error('BLOCKED: Supabase CLI is linked to PRODUCTION (Prod_mings_os).');
  console.error(`  Linked ref: ${PROD_REF}`);
  console.error(`  Command:    supabase ${args.join(' ')}`);
  console.error('');
  console.error('Use the sandbox for day-to-day work:');
  console.error('  npm run env:sandbox');
  console.error('');
  console.error('To mutate production intentionally:');
  console.error('  $env:SUPABASE_ALLOW_PROD=1; npm run supabase:push');
  console.error('');
  process.exit(1);
}

if (args.length === 0) {
  console.error('Usage: node scripts/run-supabase-cli.mjs <supabase-args...>');
  process.exit(1);
}

guardProdMutation();

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
