/**
 * Align Supabase project ref across local env + Cursor MCP.
 * Usage:
 *   node scripts/fix-supabase-project-ref.mjs dmrvycswdteuhfydchdr
 *   node scripts/fix-supabase-project-ref.mjs glpdpkozvmfzgoewquxi --anon-key <jwt>
 *   node scripts/fix-supabase-project-ref.mjs --from-production
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLD_REF = 'ofautxfwbjhyruyppqth';
const PRODUCTION_ORDER_URL = 'https://order.mings.az/';

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args[0] === '--from-production') {
    return { mode: 'production', anonKey: readAnonKeyArg(args) };
  }
  const ref = args.find((a) => /^[a-z0-9]{20}$/.test(a));
  if (!ref) {
    console.error('Usage: node scripts/fix-supabase-project-ref.mjs <project_ref> [--anon-key <jwt>]');
    console.error('       node scripts/fix-supabase-project-ref.mjs --from-production [--anon-key <jwt>]');
    process.exit(1);
  }
  return { mode: 'ref', ref, anonKey: readAnonKeyArg(args) };
}

function readAnonKeyArg(args) {
  const flagIdx = args.indexOf('--anon-key');
  if (flagIdx !== -1 && args[flagIdx + 1]) return args[flagIdx + 1];
  const jwt = args.find((a) => a.startsWith('eyJ') && a.split('.').length === 3);
  return jwt ?? null;
}

async function refFromProductionBundle() {
  const html = await fetch(PRODUCTION_ORDER_URL).then((r) => r.text());
  const jsPath = html.match(/\/assets\/[^"']+\.js/)?.[0];
  if (!jsPath) throw new Error('Could not find JS bundle on order.mings.az');
  const js = await fetch(new URL(jsPath, PRODUCTION_ORDER_URL)).then((r) => r.text());
  const ref = js.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/)?.[1];
  if (!ref) throw new Error('Could not find supabase.co ref in production bundle');
  return ref;
}

function replaceRefInEnvFile(file, newRef) {
  if (!fs.existsSync(file)) return { updated: false, reason: 'missing' };
  const text = fs.readFileSync(file, 'utf8');
  const next = text.replace(
    /^(VITE_SUPABASE_URL=)(.*)$/m,
    (_, prefix, value) => {
      let url = value.trim();
      if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
        url = url.slice(1, -1);
      }
      const updated = url.replace(/https:\/\/[a-z0-9]+\.supabase\.co/, `https://${newRef}.supabase.co`);
      if (updated === url && !url.includes(newRef)) {
        return `${prefix}https://${newRef}.supabase.co`;
      }
      return `${prefix}${updated}`;
    }
  );
  if (next === text) return { updated: false, reason: 'unchanged' };
  fs.writeFileSync(file, next, 'utf8');
  return { updated: true };
}

function syncAnonKeyInEnvFiles(anonKey) {
  if (!anonKey || anonKey.length < 20) {
    return { updated: false, reason: 'missing_or_invalid_anon_key' };
  }
  let anyUpdated = false;
  for (const file of ['.env', '.env.local']) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8');
    if (!/^VITE_SUPABASE_ANON_KEY=/m.test(text)) continue;
    const next = text.replace(/^VITE_SUPABASE_ANON_KEY=.*$/m, `VITE_SUPABASE_ANON_KEY=${anonKey}`);
    if (next !== text) {
      fs.writeFileSync(envPath, next, 'utf8');
      console.log(`${file}: updated VITE_SUPABASE_ANON_KEY`);
      anyUpdated = true;
    } else {
      console.log(`${file}: VITE_SUPABASE_ANON_KEY already matches`);
    }
  }
  return { updated: anyUpdated };
}

function updateCursorMcp(newRef) {
  const mcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  if (!fs.existsSync(mcpPath)) return { updated: false, path: mcpPath, reason: 'missing' };

  const raw = fs.readFileSync(mcpPath, 'utf8');
  const config = JSON.parse(raw);
  const server = config.mcpServers?.supabase;
  if (!server?.url) return { updated: false, path: mcpPath, reason: 'no supabase url' };

  const url = new URL(server.url);
  url.searchParams.set('project_ref', newRef);
  server.type = server.type ?? 'http';
  server.url = url.toString();
  config.mcpServers.supabase = server;

  fs.writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { updated: true, path: mcpPath, url: server.url };
}

function updateProjectMcp(newRef) {
  const mcpPath = path.join(root, '.mcp.json');
  const config = {
    mcpServers: {
      supabase: {
        type: 'http',
        url: `https://mcp.supabase.com/mcp?project_ref=${newRef}`,
        headers: {},
      },
    },
  };
  fs.writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return mcpPath;
}

const args = parseArgs(process.argv);
const newRef = args.mode === 'production' ? await refFromProductionBundle() : args.ref;

console.log(`Target Supabase project ref: ${newRef}`);
if (newRef === OLD_REF) {
  console.warn(`Warning: ref still matches deprecated ${OLD_REF}`);
}

for (const file of ['.env', '.env.local']) {
  const result = replaceRefInEnvFile(path.join(root, file), newRef);
  console.log(`${file}: ${result.updated ? 'updated' : result.reason}`);
}

if (args.anonKey) {
  syncAnonKeyInEnvFiles(args.anonKey);
} else {
  console.log(
    '\nNote: VITE_SUPABASE_ANON_KEY was not changed. Pass --anon-key <jwt> from the target project API settings, or run:'
  );
  console.log('  node scripts/sync-supabase-anon-key.mjs "<anon_jwt>"');
  console.log('Then rebuild previews (Vite bakes env at build time):');
  console.log('  npm run deploy:local && npm run deploy:local:storefront');
}

const projectMcp = updateProjectMcp(newRef);
console.log(`Wrote ${path.relative(root, projectMcp)}`);

const cursorMcp = updateCursorMcp(newRef);
console.log(
  cursorMcp.updated
    ? `Updated Cursor MCP: ${cursorMcp.path}`
    : `Cursor MCP not updated (${cursorMcp.reason}): ${cursorMcp.path}`
);

console.log('\nNext: Cursor → Settings → Tools & MCP → Supabase → reconnect / re-auth if tools are missing.');
if (args.anonKey) {
  console.log('\nRebuild local previews so the new anon key is baked into dist/:');
  console.log('  npm run deploy:local && npm run deploy:local:storefront');
  console.log('Optional smoke test: node scripts/test-auth-anon-key.mjs');
}
