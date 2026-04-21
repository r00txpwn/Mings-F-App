# /qa — Master QA Review

Run a thorough QA of the entire Mings F-App repository. Do the following steps in order:

## 1. Static checks
Run these commands and note any failures:
```
npm run typecheck
npm run lint
npm run build
```

## 2. Unit tests
```
npm test
```
Report: how many passed, how many failed, and the full failure output for any that failed.

## 3. Source code review
Read and analyse these files for correctness, consistency, and logic issues:
- `src/services/analytics/kpiCalculations.ts`
- `src/services/analytics/validation.ts`
- `src/services/analytics/financeService.ts`
- `src/services/deliveryZones.ts`
- `src/translations.ts` (check all 3 languages have the same keys)
- `src/lib/supabase.ts` (check types match what services expect)
- `supabase/functions/` (check function signatures vs callers in src/)

## 4. Documentation audit
Compare the code against these docs and flag any gaps:
- `APP_STRUCTURE.md` — is it still accurate?
- `docs/URL_ROUTING_AUDIT.md` — do all listed routes still exist in `src/main.tsx`?
- `docs/COMBO_DEALS.md` — does the combo logic in code match the spec?
- `docs/DELIVERY_JOURNEY.md` — does the delivery flow in code match the doc?
- `.env.example` — do all vars match what `scripts/verify-env.mjs` checks?

## 5. Report
Write your findings as a structured report with:
1. **Overall status**: 🟢 HEALTHY / 🟡 DEGRADED / 🔴 CRITICAL
2. **Failures** (if any) with root cause and severity
3. **Logic issues** found in source code
4. **Doc vs code gaps**
5. **Top 5 improvements** (prioritised, specific)

Then update `docs/QA_STATUS.md` with the full report and append a row to the history table.
