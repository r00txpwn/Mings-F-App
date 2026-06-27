# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-06-26T13:53:51.139Z

| Check | Status |
|-------|--------|
| TypeScript | PASSED |
| ESLint | PASSED |
| Build | PASSED |
| Unit Tests | PASSED |
| E2E | PASSED |

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
> vitest run --reporter=verbose --reporter=json --outputFile=test-results/unit-results.json


 RUN  v3.2.4 C:/Users/vinit/Mings/Mings-f-app

 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns true for a point inside the polygon 3ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for a point outside the polygon 1ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > returns false for an empty or too-small ring 0ms
 ✓ tests/unit/deliveryZones.test.ts > pointInPolygon > handles horizontal edges without dividing by zero 2ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns the first matching zone for a point inside 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > falls through to next zone when point is outside first 1ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null when point matches no zone 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > returns null for empty zones array 0ms
 ✓ tests/unit/deliveryZones.test.ts > findZoneForPoint > skips zones with missing polygon data 0ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns correct percentage 3ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 when denominator is zero 0ms
 ✓ tests/unit/kpiCalculations.test.ts > safePct > returns 0 for non-finite inputs 1ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > computes all KPIs correctly 1ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > defaults discounts and refunds to 0 when omitted 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > returns avgOrderValue of 0 when orderCount is 0 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > deducts bank fees for net profit only 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeExecutiveKpis > handles negative operating profit (loss scenario) 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects up direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects down direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > correctly detects flat direction 0ms
 ✓ tests/unit/kpiCalculations.test.ts > computeDelta > returns null pctChange when previous is 0 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > groups records by UTC date and sums amounts 18ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > returns sorted ascending result 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > skips records with null/undefined date or amount 0ms
 ✓ tests/unit/kpiCalculations.test.ts > aggregateByDay > returns empty array for empty input 0ms
 ✓ tests/unit/unitedPaymentReturnParse.test.ts > parseUnitedPaymentReturn > decodes base64 up query param 4ms
 ✓ tests/unit/unitedPaymentReturnParse.test.ts > parseUnitedPaymentReturn > reads plain JSON body fields 1ms
 ✓ tests/unit/unitedPaymentReturnParse.test.ts > parseUnitedPaymen
```
