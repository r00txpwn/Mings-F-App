# Test plan (living spec)

Human-curated checklist of what **should** be tested. The QA orchestrator diffs this plan against the repo and reports gaps in `docs/QA_STATUS.md`.

**Rules**

- Check `[x]` only when automated coverage exists and is wired in CI or `npm run qa`.
- Leave `[ ]` for gaps; tag with `GAP` and optional `priority:critical|major|minor`.
- New items are proposed in QA reports; merge them here via PR after tests are written.
- Do **not** let the agent auto-check boxes — humans approve scope growth.

**Related docs:** [RELIABILITY_QA_PRIORITIES.md](RELIABILITY_QA_PRIORITIES.md) (manual release checklist), [QA_STATUS.md](QA_STATUS.md) (generated report).

---

## Deterministic gates (block merge / deploy)

These run in PR CI (`.github/workflows/ci.yml`) and locally via `npm run qa`.

| Gate | Command | CI |
|------|---------|-----|
| TypeScript | `npm run typecheck` | required |
| ESLint | `npm run lint` | required |
| Staff build | `npm run build:staff` | required |
| Unit tests | `npm test` | required |
| E2E smoke | `npm run test:e2e` | scheduled QA only (slow) |
| Plan coverage | `npm run qa:plan` | advisory in QA report |

---

## Critical journeys

### Staff cockpit (`sp.mings.az` / `dist-staff`)

- [x] **staff-smoke-render** Renders without JS crash | `tests/e2e/smoke.staff.spec.ts` | priority:critical
- [x] **staff-smoke-auth** Shows login/auth gate (not blank) | `tests/e2e/smoke.staff.spec.ts` | priority:critical
- [x] **staff-smoke-bundle** Storefront paths not served from staff bundle | `tests/e2e/smoke.staff.spec.ts` | priority:major
- [x] **staff-smoke-assets** No 404 on JS/CSS bundles | `tests/e2e/smoke.staff.spec.ts` | priority:critical
- [x] **staff-smoke-spa** Deep link `/spec-ops?screen=dashboard` returns 200 | `tests/e2e/smoke.staff.spec.ts` | priority:major
- [x] **staff-expenses-crud** Expenses categories CRUD feedback | `tests/e2e/expenses-crud.spec.ts` | priority:major
- [ ] **staff-functional-nav** Authenticated navigation across cockpit screens | GAP | priority:major
- [ ] **staff-kpi-dashboard** Home KPI numbers match finance service inputs | GAP | priority:major

### Customer ordering (`order.mings.az` / `dist-storefront`)

- [x] **storefront-smoke-order** `/order` renders without JS crash | `tests/e2e/smoke.storefront.spec.ts` | priority:critical
- [x] **storefront-smoke-track** `/track` renders without JS crash | `tests/e2e/smoke.storefront.spec.ts` | priority:major
- [x] **storefront-smoke-assets** No 404 on JS/CSS bundles | `tests/e2e/smoke.storefront.spec.ts` | priority:critical
- [x] **storefront-smoke-isolation** Staff paths not served from storefront bundle | `tests/e2e/smoke.storefront.spec.ts` | priority:major
- [ ] **customer-checkout-card** Browse → cart → card checkout → confirmation | GAP | priority:critical
- [ ] **customer-checkout-cod** Browse → cart → COD → order created | GAP | priority:critical
- [ ] **customer-cod-kds** COD order appears on KDS board | GAP | priority:critical
- [ ] **customer-delivery-zone** Out-of-zone address blocked at checkout | GAP | priority:major

### KDS (`/kds`)

- [x] **kds-smoke-render** KDS renders without JS crash | `tests/e2e/kds-smoke.spec.ts` | priority:critical
- [ ] **kds-status-flow** pending → preparing → ready updates | GAP | priority:critical
- [ ] **kds-realtime-reconnect** Board refetches after realtime reconnect | GAP | priority:major

### Kiosk (`/kiosk`)

- [x] **kiosk-smoke-render** Kiosk renders without JS crash | `tests/e2e/kiosk-smoke.spec.ts` | priority:critical
- [ ] **kiosk-order-create** Full kiosk order → sale row created | GAP | priority:major

### POS (`/pos`)

- [x] **pos-smoke-render** POS renders without JS crash | `tests/e2e/pos-smoke.spec.ts` | priority:critical
- [ ] **pos-order-create** POS order → sale + label payload | GAP | priority:major

---

## Unit / logic coverage

### Finance & analytics (must stay accurate)

- [x] **unit-kpi** Executive KPI math | `tests/unit/kpiCalculations.test.ts` | priority:critical
- [x] **unit-validation** Revenue, net, payout reconciliation validators | `tests/unit/validation.test.ts` | priority:critical
- [x] **unit-withdrawal-fees** Withdrawal fee computation | `tests/unit/withdrawalFees.test.ts` | priority:major
- [x] **unit-supplier-ledger** Supplier outstanding + FIFO allocation | `tests/unit/supplierLedger.test.ts` | priority:major

### Operations & channels

- [x] **unit-delivery-zones** Point-in-polygon + zone lookup | `tests/unit/deliveryZones.test.ts` | priority:critical
- [x] **unit-kds-board** KDS grouping, filters, prep state | `tests/unit/kdsBoardUtils.test.ts` | priority:major
- [x] **unit-kds-payment-prep** Payment confirmed before KDS prep | `tests/unit/kdsPaymentPrep.test.ts` | priority:critical
- [x] **unit-kitchen-acceptance** Kitchen acceptance rules | `tests/unit/kitchenAcceptance.test.ts` | priority:major
- [x] **unit-sales-channels** Protected channel policy | `tests/unit/salesChannelPolicy.test.ts` | priority:major
- [x] **unit-partner-channels** Partner manual channel detection | `tests/unit/partnerSalesChannels.test.ts` | priority:minor
- [x] **unit-pos-label** POS label payload shape | `tests/unit/posLabelPayload.test.ts` | priority:major

### Payments (partial — edge logic mostly untested)

- [x] **unit-united-return** United Payment return URL parse + status map | `tests/unit/unitedPaymentReturnParse.test.ts` | priority:critical
- [ ] **unit-epoint-signature** Epoint webhook signature verification | GAP | priority:critical
- [ ] **unit-payment-idempotency** Duplicate webhook does not double-charge | GAP | priority:critical
- [ ] **unit-order-totals** Order total recomputation matches cart | GAP | priority:critical

### i18n & security expectations

- [x] **unit-translations** en / az / ru key parity | `tests/unit/translations.test.ts` | priority:critical
- [x] **unit-staff-rls** Staff RLS policy expectations (static) | `tests/unit/staffRlsPolicy.test.ts` | priority:major
- [ ] **integration-rls** Live RLS deny checks (anon cannot mutate admin tables) | `scripts/staging-rls-check.mjs` | priority:critical

---

## Edge Functions (backlog)

Extract pure logic to `_shared/` and unit-test with Vitest; add contract tests for webhooks.

| Function | Risk | Covered |
|----------|------|---------|
| `epoint-webhook` | critical | GAP |
| `epoint-create-payment` | critical | GAP |
| `united-payment-webhook` | critical | GAP |
| `united-payment-create-payment` | critical | GAP |
| `online-order-create` | critical | GAP |
| `pos-order-create` | major | GAP |
| `kds-order-status-update` | critical | GAP |
| `payment-reconcile` | major | GAP |
| `wolt-drive-*` | major | GAP |
| `admin-api` | major | GAP |

---

## Coverage targets (advisory)

| Path | Target | Notes |
|------|--------|-------|
| `src/services/**` | ≥ 70% | Run `npm run test:coverage` |
| `src/utils/**` | ≥ 70% | Same |
| Edge payment logic (`supabase/functions/**`) | ≥ 80% | After extraction to `_shared/` |

---

## How to run

```bash
# Fast gates (same as PR CI)
npm run typecheck && npm run lint && npm run build:staff && npm test

# Plan vs actual (advisory)
npm run qa:plan

# Full local QA + AI report (typecheck, lint, build, unit)
npm run qa

# E2E (starts local preview if not running)
npm run test:e2e

# Cursor: say "test initiate" for desktop + mobile smoke per .cursor/rules
```

**CI:** PRs run `.github/workflows/ci.yml` (gates only). Scheduled `.github/workflows/qa-agent.yml` runs full QA + E2E + `QA_STATUS.md` update.
