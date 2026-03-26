#!/usr/bin/env bash
# Run ONLY if db push fails with duplicate object errors.
set -e
cd "$(dirname "$0")/.."
versions=()
for f in supabase/migrations/*.sql; do
  base=$(basename "$f" .sql)
  versions+=("$base")
done
exec npx --yes supabase@latest migration repair --status applied "${versions[@]}"
