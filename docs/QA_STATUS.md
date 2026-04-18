# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-04-18T21:27:02.541Z

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

 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns correct percentage 2ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 when denominator is zero 0ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 for non-finite inputs 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > computes all KPIs correctly 1ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > defaults discounts and refunds to 0 when omitted 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > returns avgOrderValue of 0 when orderCount is 0 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > handles negative operating profit (loss scenario) 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects up direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects down direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects flat direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > returns null pctChange when previous is 0 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > groups records by UTC date and sums amounts 10ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > returns sorted ascending result 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > skips records with null/undefined date or amount 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > returns empty array for empty input 0ms
 ✓ tests/unit/translations.test.ts > translations completeness > all languages export a translations object 2ms
 ✓ tests/unit/translations.test.ts > translations completeness > all languages have the same keys as English 3ms
 ✓ tests/unit/translations.test.ts > translations completeness > no translation value is an empty string 1ms
 ✓ tests/unit/translations.test.ts > translations completeness > no translation value is undefined or null 1ms
 ✓ tests/unit/translations.test.ts > translations completeness > English has a substantial number of keys (regression guard) 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns true for a point inside the polygon 2ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for a point outside the polygon 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for an empty or too-small ring 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > handles horizontal edges without dividing by zero 1ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns the first matching zone for a point inside 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > falls through to next zone when point is outside first 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null when point matches no zone 0ms
 ✓ tests/unit/deliver
```
