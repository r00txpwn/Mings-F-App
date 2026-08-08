/**
 * Builds JSON for Supabase MCP `deploy_edge_function` (admin-api + kds-order-status-update).
 *
 * Usage:
 *   node scripts/mcp-bundle-admin-functions.mjs admin-api
 *   node scripts/mcp-bundle-admin-functions.mjs kds-order-status-update
 *   node scripts/mcp-bundle-admin-functions.mjs admin-api test-results/mcp-deploy-admin-api.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fnName = process.argv[2];
const out = process.argv[3];

const allowed = new Set(['admin-api', 'kds-order-status-update', 'user-management', 'agent-ops']);
if (!fnName || !allowed.has(fnName)) {
  console.error('Usage: node scripts/mcp-bundle-admin-functions.mjs <admin-api|kds-order-status-update|user-management|agent-ops> [out.json]');
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fnDir = path.join(root, 'supabase', 'functions');

const sharedByFunction = {
  'admin-api': ['_shared/staffAuth.ts'],
  'kds-order-status-update': ['_shared/staffAuth.ts'],
  'user-management': [],
  'agent-ops': ['_shared/agentAuth.ts', '_shared/cors.ts', '_shared/staffAuth.ts'],
};

const shared = sharedByFunction[fnName] ?? [];

function read(rel, name) {
  return {
    name,
    content: fs.readFileSync(path.join(fnDir, rel), 'utf8').replace(/\r\n/g, '\n'),
  };
}

const files = [
  read(`${fnName}/index.ts`, `functions/${fnName}/index.ts`),
  ...shared.map((rel) => read(rel, `functions/${rel.replace(/\\/g, '/')}`)),
];

const payload = {
  name: fnName,
  entrypoint_path: `functions/${fnName}/index.ts`,
  verify_jwt: false,
  files,
};

const text = JSON.stringify(payload);
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, text, 'utf8');
  console.error(`Wrote ${out} (${text.length} chars)`);
} else {
  process.stdout.write(text);
}
