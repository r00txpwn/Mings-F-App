-- Run in Supabase Dashboard → SQL Editor (project dmrvycswdteuhfydchdr)
-- when CLI cannot reach Postgres (port 5432 timeout) but the web UI works.
--
-- Marks 21 local migrations as APPLIED in history only (schema already on production).
-- Do NOT use `db push --include-all` from CLI after this — it would re-run old SQL.

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260109114111'),
  ('20260109115610'),
  ('20260109125611'),
  ('20260109125652'),
  ('20260109130841'),
  ('20260109130857'),
  ('20260109135107'),
  ('20260109140037'),
  ('20260111090552'),
  ('20260129132659'),
  ('20260129140936'),
  ('20260131131918'),
  ('20260131133116'),
  ('20260131144024'),
  ('20260214150336'),
  ('20260214152949'),
  ('20260226085127'),
  ('20260226085137'),
  ('20260226094917'),
  ('20260226101729'),
  ('20260307134713')
ON CONFLICT (version) DO NOTHING;

-- Verify: should show Remote column filled for the rows above
-- SELECT version FROM supabase_migrations.schema_migrations
-- WHERE version >= '20260109114111' AND version <= '20260618140000'
-- ORDER BY version;
