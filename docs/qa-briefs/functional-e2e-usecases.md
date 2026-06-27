# Functional E2E Use Cases — Phase 1 Results (2026-06-26)

> **Superseded by:** [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) (147 use cases, Groups A–I) and [functional-e2e-dynamic-cases.md](./functional-e2e-dynamic-cases.md) (54 adversarial cases, Group X).  
> This file preserves the **Phase 1 partial run** only. All future runs update the master catalog matrix.

**Session:** 2026-06-26  
**Staff preview:** `http://127.0.0.1:4175/`  
**Storefront preview:** `http://127.0.0.1:4176/`  
**Ledger:** [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md)

---

## Phase 1 pass/fail matrix (legacy IDs)

| Legacy UC | Master catalog ID | Title | Result | Evidence |
|-----------|-------------------|-------|--------|----------|
| A1 | A-POS-01 | POS cash order (Eat In) | **PASS** | `test-results/functional-e2e/A1-pos-cash-order.png` — #M036 |
| A2 | A-POS-02 | POS card + modifiers (Takeaway) | **PASS** | #M037 |
| A3 | A-POS-03 | POS delivery validation (negative) | **PASS** | Inline validation |
| A4 | A-KIOSK-08 | Kiosk confirm order | **FAIL** | 403 on `sales` insert |
| A5 | A-ONLINE-01 | Online cash order | **BLOCKED** | Customer OTP/Google auth |
| A6 | A-ONLINE-05 | Online card boundary | **BLOCKED** | Same auth blocker |
| A7 | H-STM-01 | Order state machine | **PARTIAL** | Confirm payment only |
| A8 | H-KOB-02 | Kiosk Orders confirm payment | **PASS** | M036 → PAID |
| B1 | D-PROD-01 | Products CRUD | **NOT RUN** | |
| B2 | D-MENU-01 | Menu Builder CRUD | **NOT RUN** | |
| B3 | D-COMB-01 | Combos CRUD | **NOT RUN** | |
| B4 | D-SUPP-01 | Suppliers + debt | **PASS** | `B4-suppliers-debt.png` |
| C1 | E-SALE-01 | Sales manual entry | **PASS** | Wolt ₼55 |
| C2 | E-OPEX-01 | Expenses + category | **PASS** | ₼25 cash expense |
| C3 | E-PAY-01 | Payouts | **PASS** | Wolt ₼100 |
| C4 | E-CASH-01 | Cash & Debt liability/withdrawal | **NOT RUN** | |
| C5 | E-CASH-06 | Cash drawer cross-check | **PASS** | ₼184.38 |
| C6 | E-PAYM-01 | Payments recheck | **NOT RUN** | |
| D1 | F-SET-03 | Settings channels | **NOT RUN** | |
| D2 | F-DEL-01 | Delivery zones | **NOT RUN** | |
| D3 | F-DEL-04 | Delivery settings | **NOT RUN** | |
| D4 | F-USR-02 | Users (risky) | **BLOCKED** | QA account not admin |
| E1 | A-TRACK-01 | Tracking happy path | **BLOCKED** | Depends on A5 track_token |

**Phase 1 summary:** 11 PASS · 1 FAIL · 1 PARTIAL · 4 BLOCKED · 7 NOT RUN (of 24 legacy cases)

**Master catalog coverage:** 147 + 54 dynamic = **201 total** use cases; Phase 1 exercised ~6% of full catalog.

---

## What Phase 1 actually tested (functions, not navigation)

| Function | Legacy UC | Master ID |
|----------|-----------|-----------|
| Create POS order (cash/card) | A1, A2 | A-POS-01, A-POS-02 |
| Delivery validation | A3 | A-POS-03 |
| Create supplier + debt + clear | B4 | D-SUPP-01, 04, 05 |
| Expense category + cash expense | C2 | E-CAT-01, E-OPEX-01 |
| Platform payout | C3 | E-PAY-01 |
| Manual partner sale | C1 | E-SALE-01 |
| Confirm payment + cash drawer math | A8, C5 | H-KOB-02, E-CASH-06 |

---

## Re-run Phase 2+

Use the master catalog execution phases:

1. **2a** — Groups D, E, F (minus Users), H  
2. **2b** — Groups B (KDS), C (Order Manager)  
3. **2c** — A-ONLINE, A-TRACK, G (owner auth)  
4. **2d** — Group X dynamic cases  
5. **2e** — Group I webhooks  

```bash
npm run deploy:local
npm run deploy:local:storefront
```

Update [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) **Phase 1 / Run status** column and append [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md).
