/**
 * Point local dev + MCP at sandbox or production Supabase.
 *
 * Usage:
 *   node scripts/switch-supabase-env.mjs sandbox
 *   node scripts/switch-supabase-env.mjs prod --confirm
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PROD_REF = 'dmrvycswdteuhfydchdr';
export const SANDBOX_REF = 'glpdpkozvmfzgoewquxi';

const ENVS = {
  sandbox: { ref: SANDBOX_REF, file: '.env.sandbox', label: 'Sandbox_mings_os' },
  prod: { ref: PROD_REF, file: '.env.production-new', label: 'Prod_mings_os' },
};

function parseEnvFile(file) {
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

function upsertEnvKeys(file, keys) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${Object.entries(keys).map(([k, v]) => `${k}=${v}`).join('\n')}\n`, 'utf8');
    return { updated: true, reason: 'created' };
  }
  let text = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(keys)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, '')}\n${line}\n`;
  }
  fs.writeFileSync(file, text, 'utf8');
  return { updated: true };
}

function updateCursorMcp(ref) {
  const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  if (!fs.existsSync(mcpPath)) return { updated: false, path: mcpPath, reason: 'missing' };
  const config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const server = config.mcpServers?.supabase;
  if (!server?.url) return { updated: false, path: mcpPath, reason: 'no supabase url' };
  const url = new URL(server.url);
  url.searchParams.set('project_ref', ref);
  server.url = url.toString();
  config.mcpServers.supabase = server;
  fs.writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { updated: true, path: mcpPath };
}

function updateProjectMcp(ref) {
  const mcpPath = path.join(root, '.mcp.json');
  fs.writeFileSync(
    mcpPath,
    `${JSON.stringify(
      {
        mcpServers: {
          supabase: {
            type: 'http',
            url: `https://mcp.supabase.com/mcp?project_ref=${ref}`,
            headers: {},
          },
        },
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  return mcpPath;
}

function linkCli(ref, dbPassword) {
  const env = { ...process.env };
  if (dbPassword) env.SUPABASE_DB_PASSWORD = dbPassword;
  const result = spawnSync('node', ['scripts/run-supabase-cli.mjs', 'link', '--project-ref', ref], {
    cwd: root,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });
  if ((result.status ?? 1) !== 0) {
    console.error('supabase link failed — set SUPABASE_DB_PASSWORD in the env file or shell and retry.');
    process.exit(result.status ?? 1);
  }
}

const target = process.argv[2];
const confirm = process.argv.includes('--confirm');
const env = ENVS[target];

if (!env) {
  console.error('Usage: node scripts/switch-supabase-env.mjs <sandbox|prod> [--confirm]');
  process.exit(1);
}

if (target === 'prod' && !confirm) {
  console.error('Refusing to point local tooling at PRODUCTION without --confirm.');
  console.error('  node scripts/switch-supabase-env.mjs prod --confirm');
  process.exit(1);
}

const sourcePath = path.join(root, env.file);
if (!fs.existsSync(sourcePath)) {
  console.error(`Missing ${env.file} — create it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.`);
  process.exit(1);
}

const source = parseEnvFile(sourcePath);
const url = source.VITE_SUPABASE_URL;
const anon = source.VITE_SUPABASE_ANON_KEY;
const dbPassword = source.SUPABASE_DB_PASSWORD;

if (!url || !anon) {
  console.error(`${env.file} must define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY`);
  process.exit(1);
}

console.log(`Switching local tooling → ${env.label} (${env.ref})`);

for (const file of ['.env', '.env.local']) {
  const result = upsertEnvKeys(path.join(root, file), {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anon,
  });
  console.log(`${file}: ${result.updated ? 'updated' : result.reason}`);
}

console.log(`Wrote ${path.relative(root, updateProjectMcp(env.ref))}`);
const cursorMcp = updateCursorMcp(env.ref);
console.log(
  cursorMcp.updated
    ? `Updated Cursor MCP: ${cursorMcp.path}`
    : `Cursor MCP not updated (${cursorMcp.reason}): ${cursorMcp.path}`
);

linkCli(env.ref, dbPassword);

console.log('\nDone. Reconnect Supabase MCP in Cursor if tools still target the old project.');
if (target === 'sandbox') {
  console.log('Default: npm run supabase:push deploys to SANDBOX only. Prod requires SUPABASE_ALLOW_PROD=1.');
}
