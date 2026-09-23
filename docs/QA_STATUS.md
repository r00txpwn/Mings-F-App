# QA Status

> AI analysis unavailable (no ANTHROPIC_API_KEY and claude CLI not found).
> Install Claude Code CLI or set ANTHROPIC_API_KEY to enable full reports.

## Last Run: 2026-09-23T19:18:08.987Z

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

 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mhostedCheckoutUrlFromInit[2m > [22mfail-closes when init is ok but checkoutUrl is missing[32m 4[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mhostedCheckoutUrlFromInit[2m > [22mreturns a usable hosted checkout URL when present[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mcardPaymentInitHandoff[2m > [22mfail-closes on create-payment HTTP failure (sale already cancelled server-side)[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mcardPaymentInitHandoff[2m > [22mfail-closes when HTTP ok but checkoutUrl is missing — do not navigate[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mcardPaymentInitHandoff[2m > [22mredirects only when ok and checkoutUrl is present[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mquery paid+saleId is eligible to clear, but OrderApp waits for saleRowIsPaid[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mfail-closes paid=1 without saleId — never invents success or clears cart[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mreads exact payment_error=1 (+ message, sale) and keeps cart[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mreads exact payment_pending=1 (+ sale) and never treats it as paid[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mfail-closes on unknown or missing flags — never invents success[32m 2[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mparseStorefrontPaymentReturn[2m > [22mfail-closes when return flags conflict — never invents success[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mstripStorefrontPaymentReturnParams[2m > [22mremoves payment return params and keeps unrelated query keys[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mplacedOrderFromSaleRow[2m > [22mmaps saleId and trackToken from a refetched sale row[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22mplacedOrderFromSaleRow[2m > [22mreturns null when there is no sale to land on[32m 1[2mms[22m[39m
 [32m✓[39m tests/unit/storefrontPaymentHandoff.test.ts[2m > [22msaleRowIsPaid[2m > [22mis true only for payment_status paid[32m 0[2mms[22m[39m
 [32m✓[39m tests/unit/kpiCalculations.
```
