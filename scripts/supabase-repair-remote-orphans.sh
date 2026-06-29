#!/usr/bin/env bash
# Run from repo root: bash scripts/supabase-repair-remote-orphans.sh
# Remote-only versions (no matching file in supabase/migrations).
set -e
cd "$(dirname "$0")/.."
exec npx --yes supabase@latest migration repair --status reverted \
  20260109092518 \
  20260214150414 \
  20260307134418 \
  20260307134421 \
  20260426185945 20260427165528 20260428113335 20260428113345 20260428113354 \
  20260428113407 20260428113416 20260428141858 20260428142121 20260428193000 \
  20260428200000 20260615111226
