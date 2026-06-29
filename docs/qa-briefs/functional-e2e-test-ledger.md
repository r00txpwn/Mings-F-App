# Functional E2E Test Ledger

**Session:** 2026-06-26  
**Environment:** Production Supabase + `http://127.0.0.1:4175/` (staff), `http://127.0.0.1:4176/` (storefront)  
**Catalog:** [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) · [Missing catalog — detailed specs](./functional-e2e-missing-catalog-detailed.md) · [dynamic cases](./functional-e2e-dynamic-cases.md) · [Chrome re-run](./functional-e2e-phase-chrome-results.md)

---

## Production safety policy

| Rule | Detail |
|------|--------|
| **Ledger everything** | Every created row, state change, and failed attempt → append below |
| **Delete nothing** | No cleanup until owner explicitly says *"clean up E2E test data"* |
| **E2E prefix** | `E2E-YYYYMMDD-<group>-<short>` on names, notes, customer fields |
| **Confirm build** | `http://127.0.0.1:4175/build-meta.json` `gitSha` must match commit under test |
| **Read-only DB checks** | SQL lookups below are OK before owner approves deletes |

---

## Prerequisites for full catalog run

| Prereq | Needed for | How to satisfy |
|--------|------------|----------------|
| **Staff login** | Groups A–I (cockpit, KDS, OM, POS) | `admin@system.local` or staff account in `.env.local` |
| **Customer auth** | A-ONLINE-*, A-TRACK-*, G-* | Owner completes OTP or Google sign-in in browser on `:4176/order` |
| **Admin role** | F-USR-* (Users screen) | Account with admin role — Phase 1 QA account was **not** admin |
| **Card payment boundary** | A-ONLINE-05, I-WH-* | Stop at redirect URL; use mock webhooks — **no live charges** |
| **SMS OTP** | G-AUTH-06/07 | Real SMS = **High** risk; use Supabase test phone or owner approval |
| **Tracking RPC** | A-TRACK-* | Verify `get_sale_tracking_public` exists in **deployed** DB (no local migration) |

---

## Risky / boundary-only actions (default: do NOT execute fully)

| Action | Catalog IDs | Default behavior |
|--------|-------------|------------------|
| Live card charge (EPoint / United Payment) | A-ONLINE-05 | Stop at payment redirect URL |
| Real SMS OTP send | G-AUTH-06 | Skip or use test credentials |
| Users delete | F-USR-02 | **Blocked** unless owner approves |
| Live Wolt API dispatch | F-DEL-08 | Stub only — safe to invoke edge fn |
| Payment webhooks | I-WH-* | Signed mock HTTP only |
| Delete production catalog rows | D-PROD-03, D-MENU-04, etc. | Prefer soft toggles; delete only E2E-created rows |

---

## Test data prefix

All manually created labels use: `E2E-20260626-`

---

## Created records (Phase 1 — live in production)

| UC (legacy) | Master ID | Table | Row ID / # | Identifier | Delete method | Status |
|-------------|-----------|-------|------------|------------|---------------|--------|
| A1 | A-POS-01 | `sales` | display **M036** | Customer `E2E-20260626-A1`, Eat In, Cash, ₼9.38 | lookup `display_number=36` | **live** |
| A2 | A-POS-02 | `sales` | display **M037** | Customer `E2E-20260626-A2`, Takeaway, Card, ₼15.00 | lookup `display_number=37` | **live** |
| B4 | D-SUPP-01 | `suppliers` | name match | `E2E-20260626-supplier` | `adminDelete('suppliers', id)` | **live** |
| B4 | D-SUPP-04 | `supplier_debts` | via supplier | ₼50 manual debt (now Paid) | cascade with supplier | **live** |
| B4 | D-SUPP-05 | `supplier_account_payments` | via supplier | ₼50 lump-sum payment 2026-06-26 | delete payment row | **live** |
| C2 | E-CAT-01 | `master_categories` | name match | `E2E-20260626-opex-cat` (operational) | `adminDelete('master_categories', id)` | **live** |
| C2 | E-OPEX-01 | `operational_expenses` | list row | ₼25 Cash, `E2E-20260626 opex expense` | Expenses screen delete | **live** |
| C3 | E-PAY-01 | `platform_payouts` | notes match | Wolt, ₼100, `E2E-20260626 payout test` | Payouts screen delete | **live** |
| C1 | E-SALE-01 | `sales` | aggregated 6/26 row | Manual Wolt ₼55, `E2E-20260626 manual Wolt sale` | Sales screen edit/delete | **live** |
| prior | E-CASH-04 | `cash_movements` | opening float | ₼200 opening float (pre-session QA) | Cash drawer → Delete movement | **live** |

### Orders — payment state changes (not new rows)

| UC (legacy) | Master ID | Table | # | Action | Notes |
|-------------|-----------|-------|---|--------|-------|
| A7/A8/C5 | H-KOB-02, E-CASH-06 | `sales` | M036 | Confirm Payment → **PAID** | Cash drawer +₼9.38; verified ₼184.38 total |

---

## Known defects logged (no cleanup)

| ID | Symptom | Catalog ref |
|----|---------|-------------|
| X-BUG-01 | Kiosk Confirm Order → 403 on `sales` insert | A-KIOSK-08 |
| X-BUG-02 | POS orders show source "KIOSK" in Kiosk Orders / OM | A-POS-01 |
| X-BUG-03 | Order Support source filter has no POS | H-SUP-* |
| X-BUG-04 | `get_sale_tracking_public` not in repo migrations | A-TRACK-* |
| X-BUG-05 | Products add/edit → 400 (`category_id` vs `master_category_id`) | D-PROD-01, D-PROD-02 |

---

## Phase 2+ ledger template

Append new rows as phases execute:

```markdown
| <date> | <Master ID> | `<table>` | <id or #> | <identifier> | <delete method> | live |
```

---

## Cleanup commands (do NOT run until owner approves)

```text
# Lookup IDs (Supabase SQL — read-only until approved):
SELECT id, display_number, customer_name, source, payment_method, payment_status, total_price
FROM sales WHERE display_number IN (36, 37) OR customer_name LIKE 'E2E-20260626%';

SELECT id, name FROM suppliers WHERE name = 'E2E-20260626-supplier';

SELECT id, name FROM master_categories WHERE name = 'E2E-20260626-opex-cat';

SELECT id, description, amount FROM operational_expenses WHERE description LIKE 'E2E-20260626%';

SELECT id, notes, payout_amount FROM platform_payouts WHERE notes LIKE 'E2E-20260626%';
```

Delete via staff UI (preferred) or `admin-api` edge function after owner approval.

---

## Local preview commands

```bash
npm run deploy:local              # staff → http://127.0.0.1:4175/spec-ops
npm run deploy:local:storefront   # order → http://127.0.0.1:4176/order
```
