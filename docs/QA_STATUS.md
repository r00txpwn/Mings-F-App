# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-06-30T17:46:52.720Z

| Check | Status |
|-------|--------|
| TypeScript | PASSED |
| ESLint | PASSED |
| Build | PASSED |
| Unit Tests | PASSED |
| E2E | SKIPPED |

## Test Plan Coverage

## Test plan coverage (machine diff)

| Metric | Value |
|--------|-------|
| Items in plan | 41 |
| Covered | 27 |
| Gaps | 14 |
| Broken refs | 0 |
| Plan coverage | 66% |

### Open gaps (critical)

- **customer-checkout-card** Browse → cart → card checkout → confirmation
- **customer-checkout-cod** Browse → cart → COD → order created
- **customer-cod-kds** COD order appears on KDS board
- **kds-status-flow** pending → preparing → ready updates
- **unit-epoint-signature** Epoint webhook signature verification
- **unit-payment-idempotency** Duplicate webhook does not double-charge
- **unit-order-totals** Order total recomputation matches cart
- **integration-rls** Live RLS deny checks (anon cannot mutate admin tables)

### Open gaps (major)

- **staff-functional-nav** Authenticated navigation across cockpit screens
- **staff-kpi-dashboard** Home KPI numbers match finance service inputs
- **customer-delivery-zone** Out-of-zone address blocked at checkout
- **kds-realtime-reconnect** Board refetches after realtime reconnect
- **kiosk-order-create** Full kiosk order → sale row created
- **pos-order-create** POS order → sale + label payload


## Unit Test Output
```

> vite-react-typescript-starter@0.0.0 test
> vitest run


[1m[46m RUN [49m[22m [36mv3.2.4 [39m[90m/home/runner/work/Mings-F-App/Mings-F-App[39m

 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns correct percentage[32m 5[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 when denominator is zero[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 for non-finite inputs[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mcomputes all KPIs correctly[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdefaults discounts and refunds to 0 when omitted[32m 3[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mreturns avgOrderValue of 0 when orderCount is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdeducts bank fees for net profit only[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdeducts payroll for net profit[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mhandles negative operating profit (loss scenario)[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects up direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects down direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mcorrectly detects flat direction[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeDelta[2m > [22mreturns null pctChange when previous is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mgroups records by UTC date and sums amounts[32m 12[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mreturns sorted ascending result[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mskips records with null/undefined date or amount[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22maggregateByDay[2m > [22mreturns empty array for empty input[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mall-time: closing = ins - outs with zero opening[32m 3[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mfolds pre-period activity into openingBalance[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcom
```
