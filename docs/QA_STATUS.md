# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-04-18T21:21:58.338Z

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


 RUN  v3.2.4 /home/user/Mings-F-App

 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns true for a point inside the polygon 2ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for a point outside the polygon 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for an empty or too-small ring 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > handles horizontal edges without dividing by zero 1ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns the first matching zone for a point inside 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > falls through to next zone when point is outside first 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null when point matches no zone 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null for empty zones array 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > skips zones with missing polygon data 0ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns no issues when totals match within epsilon 2ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns mismatch issue when totals differ beyond epsilon 1ms
 ✓ tests/unit/validation.test.ts > validateRevenueVsChannels > returns no issues when channelTotal is null/undefined 0ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > returns no issues for consistent data 0ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > returns error when operating profit is inconsistent 1ms
 ✓ tests/unit/validation.test.ts > validateNetFormula > handles negative operating profit correctly 0ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > returns no issues for null/undefined input 0ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > returns no issues for consistent payout data 0ms
 ✓ tests/unit/validation.test.ts > validatePayoutReconciliationTotals > reports all mismatches for inconsistent payout data 1ms
 ✓ tests/unit/validation.test.ts > validateAnalyticsSnapshot > returns empty array for fully consistent snapshot 0ms
 ✓ tests/unit/validation.test.ts > validateAnalyticsSnapshot > aggregates issues from all validators 0ms
 ✓ tests/unit/translations.test.ts > translations completeness > all languages export a translations object 2ms
 ✓ tests/unit/translations.test.ts > translations completeness > all languages have the same keys as English 3ms
 ✓ tests/unit/translations.test.ts > translations completeness > no translation value is an empty string 1ms
 ✓ tests/unit/translations.test.ts > translations completeness > no translation value is undefined or null 1ms
 ✓ tests/unit/translations.test.ts > translations completeness > English has a substantial number of keys (regression guard) 0ms
 ✓ tests/unit/kpiCalculations.test.ts >
```
