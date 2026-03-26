# Run ONLY if `npm run supabase:push` fails with "already exists" / duplicate object errors.
# Marks every migration file in supabase/migrations as APPLIED on remote WITHOUT running SQL.
# Use when your remote DB already matches the schema but history was out of sync.

$migrations = Get-ChildItem -Path "$PSScriptRoot/../supabase/migrations" -Filter "*.sql" |
  ForEach-Object { $_.BaseName } |
  Sort-Object

Write-Host "Marking $($migrations.Count) local migrations as applied (no SQL run)..." -ForegroundColor Cyan
npx --yes supabase@latest migration repair --status applied @migrations
exit $LASTEXITCODE
