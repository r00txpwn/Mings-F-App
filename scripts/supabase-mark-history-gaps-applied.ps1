# Run when `npm run supabase:push` says "insert before last migration" / suggests --include-all.
# Marks LOCAL migrations that already exist on production as APPLIED (no SQL run).
# Do NOT use `db push --include-all` — that would re-run destructive old migrations.

$gaps = @(
  '20260109114111','20260109115610','20260109125611','20260109125652',
  '20260109130841','20260109130857','20260109135107','20260109140037',
  '20260111090552','20260129132659','20260129140936','20260131131918',
  '20260131133116','20260131144024','20260214150336','20260214152949',
  '20260226085127','20260226085137','20260226094917','20260226101729',
  '20260307134713'
)

Write-Host "Marking $($gaps.Count) history gaps as applied (schema already on remote)..." -ForegroundColor Cyan
npx --yes supabase@latest migration repair --status applied @gaps
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Done. Next: npm run supabase:push (applies only new migrations at the end)' -ForegroundColor Green
