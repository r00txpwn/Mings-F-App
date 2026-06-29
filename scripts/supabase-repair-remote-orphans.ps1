# Run from repo root after: npx supabase@latest login && npx supabase@latest link
# Marks REMOTE-ONLY migration records as "reverted" (versions with NO file in supabase/migrations).
# Does NOT touch local migration IDs — reverting those causes "insert before last migration" / --include-all traps.
# Schema is unchanged; only supabase_migrations history is updated.

$orphans = @(
  # No local file — remote history only
  '20260109092518',
  '20260214150414',
  '20260307134418',
  '20260307134421',
  # dmrvycswdteuhfydchdr — applied via Dashboard/MCP/other branch (2026-06-18)
  '20260426185945','20260427165528','20260428113335','20260428113345','20260428113354',
  '20260428113407','20260428113416','20260428141858','20260428142121','20260428193000',
  '20260428200000','20260615111226'
)

Write-Host 'Repairing remote-only orphan versions (-> reverted)...' -ForegroundColor Cyan
npx --yes supabase@latest migration repair --status reverted @orphans
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Done. If push asks for --include-all, run: npm run supabase:mark:history-gaps:ps' -ForegroundColor Green
Write-Host 'Then: npm run supabase:push' -ForegroundColor Green
