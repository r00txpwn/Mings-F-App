import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'scripts/supabase-push-pending-dashboard.sql');

const header = `-- Run in Supabase Dashboard → SQL Editor (project dmrvycswdteuhfydchdr)
-- when npm run supabase:push times out on port 5432 from your PC.
-- Safe to re-run. Run SECTION 4 last (or after each section if running separately).
-- Note: SECTION 2 uses production-safe 20260614170000 (skips public.categories from 20260610120000).

`;

const files = [
  ['SECTION 1 — 20260427102000', 'supabase/migrations/20260427102000_customer_auth_address_ux_mvp.sql'],
  [
    'SECTION 2 — 20260614170000 (production-safe RLS; replaces 20260610120000)',
    'supabase/migrations/20260614170000_harden_staff_only_rls_no_categories.sql',
  ],
  ['SECTION 3 — 20260618140000 KDS', 'supabase/migrations/20260618140000_kds_anon_read_kitchen_queue.sql'],
];

let out = header;
for (const [label, rel] of files) {
  out += `\n-- =============================================================================\n`;
  out += `-- ${label}\n`;
  out += `-- =============================================================================\n\n`;
  out += fs.readFileSync(path.join(root, rel), 'utf8').trim() + '\n\n';
}

out += `-- =============================================================================
-- SECTION 4 — record all 4 pending versions in migration history
-- =============================================================================

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260427102000'),
  ('20260610120000'),
  ('20260614170000'),
  ('20260618140000')
ON CONFLICT (version) DO NOTHING;
`;

fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} bytes)`);
