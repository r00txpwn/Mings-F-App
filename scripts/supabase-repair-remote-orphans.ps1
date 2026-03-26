# Run from repo root after: npx supabase@latest login && npx supabase@latest link
# Marks REMOTE-ONLY migration records as "reverted" so they no longer conflict with local files.
# Your database schema is unchanged — only the history table is fixed.

$orphans = @(
  '20260109092518','20260109114111','20260109115610','20260109125611','20260109125652',
  '20260109130841','20260109130857','20260109135107','20260109140037','20260111090552',
  '20260129132659','20260129140936','20260131131918','20260131133116','20260131144024',
  '20260214150336','20260214150414','20260214152949','20260226085127','20260226085137',
  '20260226094917','20260226101729','20260307134418','20260307134421','20260307134713'
)

Write-Host 'Repairing remote migration history (orphan versions -> reverted)...' -ForegroundColor Cyan
npx --yes supabase@latest migration repair --status reverted @orphans
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Done. Next: npm run supabase:push' -ForegroundColor Green
