# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-09-06T17:50:08.786Z

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

> mings-os@1.0.1 test
> vitest run


[1m[46m RUN [49m[22m [36mv3.2.4 [39m[90m/home/runner/work/Mings-F-App/Mings-F-App[39m

 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22muses calendar days in month for daily rate (option C)[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mMashallah 1200: Sunday offs included; one Monday absent deducts one day[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mweekly off alone does not reduce payable[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mleaves mid-month: payable covers days through left_at inclusive[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mleave + absence only counts absences during employment[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mwork mark overrides default Sunday off[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mtap cycle stores overrides and clears back to defaults[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mhides employees outside the selected month employment window[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroster: left in July is hidden in August by default, visible with showLeft[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroster: still-active employee without left_at stays visible[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroundMoney3 keeps three decimals[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns correct percentage[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 when denominator is zero[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22msafePct[2m > [22mreturns 0 for non-finite inputs[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mcomputes all KPIs correctly[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdefaults discounts and refunds to 0 when omitted[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mreturns avgOrderValue of 0 when orderCount is 0[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdeducts bank fees for net profit only[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.test.ts[2m > [22mcomputeExecutiveKpis[2m > [22mdeducts payroll fo
```
