/**
 * Builds the JSON body for Supabase MCP `deploy_edge_function` from repo files.
 * Paths in `files[].name` use the `functions/...` prefix (hosted layout).
 *
 * Usage:
 *   node scripts/mcp-bundle-online-order-create.mjs test-results/mcp-deploy-online-order-create.json
 *   # Paste the JSON into Cursor Supabase MCP → deploy_edge_function (arguments)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const fnDir = path.join(root, 'supabase', 'functions');

const files = [
  ['online-order-create/index.ts', 'functions/online-order-create/index.ts'],
  ['_shared/cors.ts', 'functions/_shared/cors.ts'],
  ['_shared/geo.ts', 'functions/_shared/geo.ts'],
  ['_shared/money.ts', 'functions/_shared/money.ts'],
  ['_shared/kitchenAcceptance.ts', 'functions/_shared/kitchenAcceptance.ts'],
].map(([rel, name]) => ({
  name,
  /** LF-only shrinks JSON escapes vs Windows CRLF in MCP payloads. */
  content: fs.readFileSync(path.join(fnDir, rel), 'utf8').replace(/\r\n/g, '\n'),
}));

const payload = {
  name: 'online-order-create',
  entrypoint_path: 'functions/online-order-create/index.ts',
  verify_jwt: false,
  files,
};

const out = process.argv[2];
const pretty = process.argv.includes('--pretty');
const text = JSON.stringify(payload, null, pretty ? 2 : undefined);
if (out) {
  fs.writeFileSync(out, text, 'utf8');
  process.stderr.write(`Wrote ${out} (${text.length} chars)${pretty ? ' pretty-printed' : ''}\n`);
} else {
  process.stdout.write(text);
}
