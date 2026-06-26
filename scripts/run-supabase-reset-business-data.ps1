# Opens Supabase SQL Editor instructions and optional CLI push for migrations.
# The truncate itself must run in Dashboard SQL Editor (HTTPS) unless db push + psql pooler works.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $root "scripts\supabase-reset-business-data.sql"

Write-Host ""
Write-Host '=== Mings OS - business data reset ===' -ForegroundColor Cyan
Write-Host ""
Write-Host "This CLEARS orders, menu, expenses, suppliers, customers, etc."
Write-Host "It KEEPS: auth users, public.users, sales_channels, online_settings."
Write-Host ""
Write-Host '1) Apply pending migrations (includes suppliers GRANT fix):'
Write-Host '   npm run supabase:push'
Write-Host ''
Write-Host '2) Run the reset SQL in Supabase Dashboard - SQL Editor:'
Write-Host '   File: scripts/supabase-reset-business-data.sql'
Write-Host ''
Write-Host '3) Refresh cockpit: http://127.0.0.1:4175/spec-ops?screen=money'
Write-Host ""

if (Test-Path $sqlPath) {
  try {
    Get-Content $sqlPath -Raw | Set-Clipboard
    Write-Host 'SQL copied to clipboard - paste into SQL Editor and Run.' -ForegroundColor Green
  } catch {
    Write-Host 'Open scripts/supabase-reset-business-data.sql and paste into SQL Editor.' -ForegroundColor Yellow
  }
} else {
  Write-Host "Warning: $sqlPath not found." -ForegroundColor Yellow
}
