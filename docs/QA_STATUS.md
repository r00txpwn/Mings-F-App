# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-04-21T15:28:42.687Z

| Check | Status |
|-------|--------|
| TypeScript | PASSED |
| ESLint | PASSED |
| Build | PASSED |
| Unit Tests | PASSED |
| E2E | SKIPPED |

## Unit Test Output
```

> vite-react-typescript-starter@0.0.0 test
> vitest run --reporter=verbose --reporter=json --outputFile=test-results/unit-results.json


 RUN  v3.2.4 C:/Users/vinit/Mings/Mings-f-app

 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns true for a point inside the polygon 3ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for a point outside the polygon 1ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for an empty or too-small ring 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > handles horizontal edges without dividing by zero 2ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns the first matching zone for a point inside 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > falls through to next zone when point is outside first 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null when point matches no zone 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null for empty zones array 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > skips zones with missing polygon data 0ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns no issues when totals match within epsilon 4ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns mismatch issue when totals differ beyond epsilon 1ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns no issues when channelTotal is null/undefined 1ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > returns no issues for consistent data 0ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > returns error when operating profit is inconsistent 1ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > handles negative operating profit correctly 1ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > returns no issues for null/undefined input 1ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > returns no issues for consistent payout data 0ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > reports all mismatches for inconsistent payout data 1ms
 ✓ tests/unit/validation.test.ts > validateAnalyticsSnapshot > returns empty array for fully consistent snapshot 1ms
 ✓ tests/unit/validation.test.ts > validateAnalyticsSnapshot > aggregates issues from all validators 1ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns correct percentage 3ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 when denominator is zero 0ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 for non-finite inputs 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > computes all KPIs correctly 1ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > defaults discounts and refunds to 0 when omitted 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > returns avgOrderValue of 0 when orderCount is 0 0ms
 ✓ tests/unit/kpiCalc
```
