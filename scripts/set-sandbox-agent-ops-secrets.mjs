/**
 * Set agent-ops Edge secrets on the sandbox Supabase project only.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... \
 *   SANDBOX_AGENT_API_KEY=$(openssl rand -hex 32) \
 *   node scripts/set-sandbox-agent-ops-secrets.mjs
 *
 * Or pass the key:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/set-sandbox-agent-ops-secrets.mjs <hex-key>
 *
 * Never points at production (dmrvycswdteuhfydchdr).
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SANDBOX_REF = 'glpdpkozvmfzgoewquxi';
const PROD_REF = 'dmrvycswdteuhfydchdr';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const token = (process.env.SUPABASE_ACCESS_TOKEN ?? '').trim();
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)');
  process.exit(1);
}

const argKey = (process.argv[2] ?? '').trim();
const envKey = (process.env.SANDBOX_AGENT_API_KEY ?? '').trim();
const key = argKey || envKey || randomBytes(32).toString('hex');
if (!/^[0-9a-f]{64}$/i.test(key)) {
  console.error('AGENT_API_KEY must be 64 hex chars (openssl rand -hex 32)');
  process.exit(1);
}

if (process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_PROJECT_REF !== SANDBOX_REF) {
  console.error(`Refusing non-sandbox SUPABASE_PROJECT_REF=${process.env.SUPABASE_PROJECT_REF}`);
  process.exit(1);
}

const secrets = [
  `AGENT_API_KEY=${key}`,
  'AGENT_MUTATIONS_ENABLED=true',
];

console.log(`Setting agent-ops secrets on sandbox ${SANDBOX_REF} (prod ${PROD_REF} untouched)…`);

const result = spawnSync(
  'npx',
  ['--yes', 'supabase@latest', 'secrets', 'set', ...secrets, '--project-ref', SANDBOX_REF],
  {
    cwd: root,
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    encoding: 'utf8',
  },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const envPath = path.join(root, '.env.sandbox.agent');
const body = [
  '# Gitignored — sandbox Hermes / MCP test wiring',
  `# Generated ${new Date().toISOString()}`,
  `MINGS_SUPABASE_URL=https://${SANDBOX_REF}.supabase.co`,
  `MINGS_AGENT_API_KEY=${key}`,
  '',
].join('\n');
fs.writeFileSync(envPath, body, { mode: 0o600 });
console.log(`Wrote ${envPath} (gitignored). Use that key in Hermes MCP env.`);
console.log('Smoke test:');
console.log(
  `  set -a && source .env.sandbox.agent && set +a && curl -sS "$MINGS_SUPABASE_URL/functions/v1/agent-ops" -H "Authorization: Bearer $MINGS_AGENT_API_KEY" -H "Content-Type: application/json" -d '{"action":"list_capabilities"}'`,
);
