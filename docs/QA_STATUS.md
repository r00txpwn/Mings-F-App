# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-08-22T04:31:39.300Z

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

 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22muses calendar days in month for daily rate (option C)[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mMashallah 1200: Sunday offs included; one Monday absent deducts one day[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mweekly off alone does not reduce payable[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mleaves mid-month: payable covers days through left_at inclusive[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mleave + absence only counts absences during employment[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mwork mark overrides default Sunday off[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mtap cycle stores overrides and clears back to defaults[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mhides employees outside the selected month employment window[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroster: left in July is hidden in August by default, visible with showLeft[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroster: still-active employee without left_at stays visible[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/payrollMonth.test.ts[2m > [22mpayrollMonth[2m > [22mroundMoney3 keeps three decimals[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mall-time: closing = ins - outs with zero opening[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mfolds pre-period activity into openingBalance[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mexcludes entries after endDate[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22madds net bank withdrawals (amount − fee) as cash in[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mbreaks down cash-out by source[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22madds cash payouts received as cash in[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mdeducts paid-now cash purchases from the drawer[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/cashDrawer.test.ts[2m > [22mcomputeCashDrawer[2m > [22mtreat
```
