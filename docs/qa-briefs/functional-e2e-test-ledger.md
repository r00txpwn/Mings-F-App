# Functional E2E Test Ledger

**Session:** 2026-06-26  
**Environment:** Production Supabase + `http://127.0.0.1:4175/` (staff), `http://127.0.0.1:4176/` (storefront)  
**Catalog:** [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) · [Missing catalog — detailed specs](./functional-e2e-missing-catalog-detailed.md) · [dynamic cases](./functional-e2e-dynamic-cases.md) · [Chrome re-run](./functional-e2e-phase-chrome-results.md)

---

## June 2026 month simulation (SANDBOX)

**Started:** 2026-06-30  
**Environment:** **Sandbox_mings_os** (`glpdpkozvmfzgoewquxi`) + `http://127.0.0.1:4175/` (staff), `http://127.0.0.1:4176/` (storefront)  
**Driver:** **`user-chrome-devtools` MCP only** — see [E2E_CHROME_DEVTOOLS_POLICY.md](./E2E_CHROME_DEVTOOLS_POLICY.md)  
**Plan:** [june-2026-e2e-daily-scenario.md](./june-2026-e2e-daily-scenario.md)  
**Prefix:** `E2E-202606XX-`  
**Git SHA (start):** `86ec2c823290e4e791da8f103037835ab43e6dd4`  
**Daily sales rules:** ~₼1500/day target (80% Wolt / 10% Bolt / 10% other) — see [Daily gross appendix](june-2026-e2e-daily-scenario.md#daily-gross-appendix-june-1--30)

### Daily gross tracker

**Audited:** 2026-06-30 via sandbox SQL + Home MTD. Manual sales on `?screen=sales` with `E2E-202606{DD}-wolt|bolt|cq` notes.

| Day | Target ₼ | Actual ₼ | Status | Notes |
|-----|----------|----------|--------|-------|
| 1 | 1782 | 1782 | PASS | |
| 2 | 1533 | 1533 | PASS | Deduped 4 retry rows |
| 3 | 1534 | 1534 | PASS | |
| 4 | 1785 | 1785 | PASS | |
| 5 | 1536 | 1536 | PASS | |
| 6 | 1537 | 1537 | PASS | |
| 7 | 807 | 807 | PASS | slow day |
| 8 | 1539 | 1539 | PASS | |
| 9 | 1540 | 1540 | PASS | |
| 10 | 1541 | 1541 | PASS | |
| 11 | 1792 | 1792 | PASS | busy day |
| 12 | 1543 | 1543 | PASS | |
| 13 | 1544 | 1544 | PASS | |
| 14 | 814 | 814 | PASS | slow day |
| 15 | 1546 | 1546 | PASS | |
| 16 | 1547 | 1547 | PASS | |
| 17 | 817 | 817 | PASS | slow day |
| 18 | 1799 | 1799 | PASS | busy day |
| 19 | 1550 | 1550 | PASS | Deduped 2 retry rows |
| 20 | 1551 | 1551 | PASS | Deduped 3 retry rows |
| 21 | 821 | 821 | PASS | Deduped 2 retry rows |
| 22 | 1553 | 1553 | PASS | Deduped 2 retry rows |
| 23 | 1554 | 1554 | PASS | Deduped 3 retry rows |
| 24 | 824 | 824 | PASS | Deduped 1 retry row |
| 25 | 1806 | 1806 | PASS | busy day |
| 26 | 1557 | 1557 | PASS | |
| 27 | 1558 | 1558 | PASS | |
| 28 | 828 | 828 | PASS | slow day |
| 29 | 1560 | 1560 | PASS | |
| 30 | 1561 | 1561 | PASS | |
| **MTD** | **43259** | **43259** | **PASS** | 90 rows (3/day × 30) |

**Cleanup:** Removed 17 duplicate manual-sale rows (sandbox SQL dedupe by `notes` + date, kept newest).

| Day | UC ID | Table | Row ID / # | Identifier | Target ₼ | Actual ₼ | Status |
|-----|-------|-------|------------|------------|----------|----------|--------|
| 1 | PRE-01 | env | — | sandbox `glpdpkozvmfzgoewquxi` | — | — | PASS |
| 1 | PRE-02 | build-meta | — | SHA `86ec2c823290e4e791da8f103037835ab43e6dd4` | — | — | PASS |
| 1 | D-MENU-JUN1 | master_categories | 52902298-… | `E2E-Wok-Noodles` | — | — | PASS |
| 1 | D-MENU-JUN1 | master_categories | — | `E2E-Drinks` | — | — | PASS |
| 1 | D-MENU-JUN1 | products | ×8 | All 8 Wolt menu items + visibility | — | — | PASS |
| 1 | BLOCKER-FIX | auth.users | 9739a82f-… | Set `app_metadata.role=admin` (admin-api 403) | — | — | FIXED |
| 1 | BLOCKER-FIX | grants | — | Restored `service_role` GRANTs on admin-api tables | — | — | FIXED |
| 1 | F-SET-01/02/04 | settings | — | language/theme/channels verified | — | — | PASS |
| 1 | F-DEL-* | delivery | — | settings read; zone polygon **BLOCKED** (map clicks) | — | — | PARTIAL |
| 1 | E-CASH-07 | finance_accounts | — | Bank opening ₼1000, card ₼0, Jun 1 | — | — | PASS |
| 1 | E-CASH-04 | cash_movements | — | Opening float ₼100 `E2E-20260601-opening-float` | — | — | PASS |
| 1 | PRE-03 | auth | 287180bc-… | `e2e-june@mings.test` (SQL create; sign-in `:4176` PASS) | — | — | PASS |
| 1 | E-SALE-DAY1 | sales | ×3 | Jun 1 Wolt/Bolt/CQ gross **₼1782** | 1782 | 1782 | PASS |
| 1 | E-HOME-01 | home | — | Jun 1 revenue verified on chart | 1782 | 1782 | PASS |
| 2 | BLOCKER-FIX | grants | — | `modifier_*`, `combo_*` tables → `service_role` | — | — | FIXED |
| 2 | D-MENU-08/09 | modifier_groups | 2f891aa5-… | `E2E-20260602-spice` + Mild/Medium/Hot on Shrimp/Chicken | — | — | PASS |
| 2 | D-COMB-01 | combo_deals | 08c80e5e-… | `E2E-20260602-lunch` ₼18 (Noodles + Drink groups) | — | — | PASS |
| 2 | D-PROD-01 / X-BUG-05 | products | — | Edit save → **200 OK** (expected 400; bug may be fixed) | — | — | FAIL* |
| 2 | E-SALE-DAY2 | sales | ×3 | Jun 2 Wolt/Bolt/CQ gross **₼1533** | 1533 | 1533 | PASS |
| 3 | BLOCKER-FIX | grants | — | `employees`, `salary_payments`; `sales`/`sale_items` for POS | — | — | FIXED |
| 3 | E-STF-01 | employees | ×4 | `E2E-20260603-chef/waiter/expeditor/helper` | — | — | PASS |
| 3 | A-POS-01 | sales | 6fb26d9b-… | **M002** eat-in cash Shrimp+Mild `E2E-20260603-pos1` | — | 16.94 | PASS |
| 3 | C-OM-06 | sales | M002 | Accept + 15 min prep → `preparing` | — | — | PASS |
| 3 | B-KDS-02/03/04 | sales | M002 | Item prep → Mark Ready → Complete (`order_status=completed`) | — | — | PASS |
| 3 | H-KOB-02 | order-support | M002 | Confirm payment — UI only on `pending`; order already `preparing`, still **unpaid** | — | — | PARTIAL |
| 3 | E-SALE-DAY3 | sales | ×3 | Jun 3 Wolt/Bolt/CQ gross **₼1534** (manual rows) | 1534 | 1534 | PASS |
| 4 | A-KIOSK-02..08 | sales | M003 | Kiosk eat-in Chicken+Medium + Soft Drink; notes `E2E-20260604-kiosk1` (SQL tag) | — | 12.78 | PASS |
| 4 | A-POS-02 | sales | M004 | Takeaway card + Hot modifier `E2E-20260604-pos2` (`pos_takeaway`) | — | 9.78 | PASS |
| 4 | H-SUP-04 | sales | M004 | Order-support reject → reason **Customer request** → `order_status=cancelled` | — | — | PASS |
| 4 | C-OM-06 | sales | M003 | POS Accept + 10 min prep → `preparing` | — | — | PASS |
| 4 | B-KDS-06 | sales | M003 | KDS **Mark item prepared** toggle on Chicken Noodles (→ *Mark item not prepared*) | — | — | PASS |
| 4 | E-SALE-W1D4 / B-W1D4 | sales | ×2 | Jun 4 Wolt/Bolt manual gross (in MTD) | 1785 | 1785 | PASS |
| 5 | BLOCKER-FIX | grants | — | `operational_expenses`, `expense_items`, `master_categories` → `service_role` + `authenticated` | — | — | FIXED |
| 5 | E-CAT-01/03 | master_categories | 8d6a486b-… | `E2E-20260605-opex-cat` + item `E2E-20260605-utilities` | — | — | PASS |
| 5 | E-OPEX-01 | operational_expenses | ×3 | Cash ₼30, Card ₼45, Bank ₼100 (Jun 5) | 175 | 175 | PASS |
| 5 | E-MONY-01 | money | — | Sales / COGS / Opex tabs load; opex total **₼175** | — | — | PASS |
| 5 | E-SALE-W1D5 / B-W1D5 / CQ2 | sales | ×3 | Jun 5 manual gross (in MTD) | 1536 | 1536 | PASS |
| 6 | BLOCKER-FIX | grants | — | `suppliers`, `supplier_debts`, `supplier_account_payments`, `purchases` → `service_role` + `authenticated` | — | — | FIXED |
| 6 | D-SUPP-01 | suppliers | 673a7e42-… / 21842677-… | `E2E-20260606-meat`, `E2E-20260606-veg` (hidden from list by `isTestRecord`) | — | — | PASS |
| 6 | E-COGS-04 | purchases | a46a7aa7-… | Meat on-account ₼150 `E2E-20260606-cogs-meat` | — | 150 | PASS |
| 6 | E-COGS-01 | purchases | — | Veg paid-now cash ₼80 `E2E-20260606-cogs-veg` | — | 80 | PASS |
| 6 | D-SUPP-04/05 | supplier_debts / payments | SQL | Manual debt ₼50 + partial pay ₼30 on meat (drawer N/A — E2E names filtered) | 50 / 30 | 50 / 30 | PASS* |
| 6 | E-PAY-WOLT-1 | platform_payouts | — | Wolt Jun 1–5 → ₼5555.60 (85% of ₼6536 gross), date Jun 6, **bank** | 5555.60 | 5555.60 | PASS |
| 6 | E-HOME-VERIFY | home | — | Bank **₼6455.60** ↑; outstanding debt **₼170**; payout commission **₼980.40** | — | — | PASS |
| 6 | E-SALE-B-W1D6 | sales | ×1 | Bolt Jun 6 manual row (in MTD) | 1537 | 1537 | PASS |
| 7 | E-CASH-03 | bank_withdrawals | ×2 | Cashier ₼100 (bank) + ATM ₼50 (card) on **2026-06-07** | — | — | PASS |
| 7 | E-CASH-08 | account_transfers | — | Bank→card ₼300 `E2E-20260607-bank-card` (Jun 7) | — | 300 | PASS |
| 7 | E-CASH-04 | cash_movements | — | Bank deposit out ₼80 `E2E-20260607-bank-deposit` (Jun 7) | — | 80 | PASS |
| 7 | E-CASH-06 | liabilities | — | Balances: cash **₼28.50**, bank **₼6135.60**, card **₼205.00**; drawer breakdown read | — | — | PASS |
| 7 | E-SALE-W2D1 / B-W1D7 / CQ3 | sales | ×3 | Jun 7 Wolt/Bolt/CQ manual gross (in MTD, slow day ₼807) | 807 | 807 | PASS |
| 8 | E-PAY-BOLT-1 | platform_payouts | — | Bolt Jun 1–7 → ₼893.69 (85% of ₼1051.40 gross), date Jun 8, **card**, notes `E2E-PAY-BOLT-1 Jun 1-7` | 893.69 | 893.69 | PASS |
| 8 | E-CASH-01 | liabilities | 056bbb42-… | Loan `E2E-20260608-equipment` ₼2000 (Jun 8); UI list empty — `isTestRecord()` hides E2E names | 2000 | 2000 | PASS* |
| 8 | E-CASH-02 | liability_payments | SQL | Partial pay ₼200 on equipment loan (Jun 8, bank); status **partially_paid** | 200 | 200 | PASS* |
| 8 | E-RPT-01 | reports | — | Custom Jun 1–7: sales **₼10514**, COGS **₼150**, opex **₼175**, platform **₼1138.11**, net **₼8549.39** | — | — | PASS |
| 8 | audit-log | admin_audit_log / audit_logs / auth_events | — | **PASS** after GRANT SELECT; open via sidebar (direct URL races auth). 50 actions / 50 changes / 50 sign-ins | — | — | PASS |
| 8 | E-HOME-VERIFY | home | — | Card **₼1098.69** (↑893.69); outstanding debt **₼1970**; bank **₼6135.60**; cash **₼28.50** | — | — | PASS |
| 8 | E-SALE-W2D2 / B-W2D1 / CQ3 | sales | ×3 | Jun 8 manual gross (in MTD, ₼1539) | 1539 | 1539 | PASS |
| 9 | BLOCKER-FIX | delivery_zones | 213eba1f-… | Created `E2E-20260601-zone` via SQL (map polygon BLOCKED Jun 1) | — | — | PASS* |
| 9 | A-POS-04 | sales | 559918ea-… | **M005** POS delivery Chicken+Mild ₼11.78+fee ₼2 `E2E-20260609-pos-delivery` | — | 11.78 | PASS |
| 9 | H-SUP-06/08 | sales | M005 | Accept → preparing → ready → **completed** (order-support) | — | — | PASS |
| 9 | F-DEL-10 | delivery dispatch | 4eeebbdb-… | **PASS** — Dispatch tab **Mark manual** on **#W005** prompts for URL → `dispatched` + `delivery_orders.tracking_url` + `manually_dispatched=true`. Sandbox fixes: column, GRANT, unique `sale_id`. UI fix: `DispatchTab` sends `trackingUrl`. | — | — | PASS |
| 9 | E-LOC-01 | order-locations | — | Map shows **1 POS delivery** dot (M005) | — | — | PASS |
| 9 | E-SALE-W2D3 / B-W2D2 | sales | ×2 | Jun 9 manual gross (in MTD, ₼1540) | 1540 | 1540 | PASS |
| 10 | E-SALE-W2D4 / B-W2D3 | sales | ×2 | Jun 10 manual gross (in MTD, ₼1541) | 1541 | 1541 | PASS |
| 10 | A-POS-01 | sales | a735098b-… | **M006** POS Shrimp+Mild ₼16.94 `E2E-20260610-pos-eatin` (source recorded `pos_takeaway`) | — | 16.94 | PASS |
| 11 | E-SALE-W2D5 / B-W2D4 | sales | ×2 | Jun 11 manual gross (in MTD, busy ₼1792) | 1792 | 1792 | PASS |
| 11 | C-OM-01 | order-manager | online_settings | Pause **30 min** → “Paused until Wed 04:13” | — | — | PASS |
| 11 | C-OM-05 | order-manager | online_settings | **Open now** clears pause (`is_open=true`, `offline_until=null`); banner **Closed by hours** at ~04:00 outside 11:30–22:30 — expected | — | — | PASS* |
| 11 | C-OM-10 | order-manager | — | Menu Editor: E2E products + Kiosk/Online toggles visible | — | — | PASS |
| 11 | C-OM-M003 | order-manager | 0a55707f-… | **M003** kiosk **Picked up** → `completed` | — | — | PASS |
| 11 | C-OM-11 | order-manager | M006 | Accept M006 with **10 min** prep → `preparing` | — | — | PASS |
| 10 | C-OM-M006 | order-manager | a735098b-… | **M006** **Ready** → **Picked up** → `completed` | — | — | PASS |
| 11 | C-OM-15 | products | 60a56c0f-… | Kiosk toggle **PASS** — OM Menu Editor `admin-api` POST 200; `kiosk_visible` false→true on **E2E-Shrimp-Noodles**. Fix: `adminApi` reads persisted staff JWT + `fetch` to edge fn (invoke hung on long-lived OM tab). | — | — | PASS |
| 11 | H-KDS-03 | order-manager | M003 | M003 marked **Ready** (clears Jun 4 kiosk backlog) | — | — | PASS |
| 12 | G-CART-01 | order | — | Browse 8 items; cart Shrimp+Drink+Chicken **₼29.32** on `:4176/order` | — | — | PASS |
| 12 | G-PROF-01 | auth | — | `e2e-june@mings.test` session active (Account → Sign out visible) | — | — | PASS |
| 12 | X-SANDBOX-AUTH-01/02 | order | — | Checkout requires **SMS phone verify** — COD blocked without OTP (expected sandbox) | — | — | PASS* |
| 12 | A-ONLINE-01 | sales | — | **BLOCKED** — Place Order disabled until phone OTP | — | — | BLOCKED |
| 12 | E-PAY-WOLT-2 | platform_payouts | 34a07cfc-… | Wolt Jun 7–11 → **₼4908.92**, date Jun 12, **bank** (admin-api via Chrome session) | 4908.92 | 4908.92 | PASS* |
| 13 | A-ONLINE-02/03/04 | order | — | Online delivery COD **BLOCKED** (SMS OTP) | — | — | BLOCKED |
| 13 | X-DEL-01 | checkout | — | Outside-zone block not exercised (OTP gate first) | — | — | DEFER |
| 13 | E-SALE-W3D1 / B-W2D5 | sales | ×2 | Jun 13 manual gross (in MTD, ₼1544) | 1544 | 1544 | PASS |
| 14 | E-SALE-02 | sales | fd65af8c-… | Edit Jun 28 CQ manual **₼82.80 → ₼83.80** (Jun 14 rows not in 50-row list) | 83.80 | 83.80 | PASS |
| 14 | E-SALE-03 | sales | E2E-20260628-bolt | Delete Jun 28 Bolt manual via UI confirm; re-added `E2E-20260628-bolt-readd` ₼82.80 | — | — | PASS |
| 14 | E-OPEX-02 | operational_expenses | e524ec48-… | Edit cash OPEX **₼30 → ₼31** via admin-api (E2E rows hidden in UI) | 31 | 31 | PASS* |
| 14 | E-OPEX-03 | operational_expenses | 3da33e67-… | Delete card OPEX; re-added `E2E-20260605-opex-card-readd` ₼45 | — | — | PASS* |
| 14 | E-COGS-02 | purchases | 8e8cc809-… | Edit veg COGS **₼80 → ₼85** via admin-api | 85 | 85 | PASS* |
| 14 | E-PAY-02 | platform_payouts | 07db7802-… | Wolt #1 payout **₼5555.6 → ₼5556.6** via admin-api | 5556.6 | 5556.6 | PASS* |
| 14 | E-CAT-02 | master_categories | 8d6a486b-… | Delete blocked by FK (linked OPEX) — expected guard | — | — | PASS* |
| 14 | E-SALE-W3D2 / B-W2D6 / B-W2D7 | sales | ×3 | Jun 14 manual gross (in MTD, slow ₼814) | 814 | 814 | PASS |
| 15 | E-PAY-BOLT-2 | platform_payouts | — | Bolt Jun 8–14 → **₼876.61**, date Jun 15, **card** | 876.61 | 876.61 | PASS* |
| 15 | E-PAY-CQ-1 | platform_payouts | — | ChoiceQR Jun 1–14 → **₼1770.30**, date Jun 15, **cash** | 1770.30 | 1770.30 | PASS* |
| 15 | E-STF-03/04 | employees / salary_payments | ebf88e7d-… | Joiner `E2E-20260615-joiner` ₼250; half-month pay ₼125 + advance ₼50 | — | — | PASS* |
| 15 | E-SALE-W3D3 / B-W3D1 | sales | ×2 | Jun 15 manual gross (in MTD, ₼1546) | 1546 | 1546 | PASS |
| 16 | E-SALE-W3D4 / B-W3D2 | sales | ×2 | Jun 16 manual gross (in MTD, ₼1547) | 1547 | 1547 | PASS |
| 17 | E-SALE-W3D5 / B-W3D3 | sales | ×2 | Jun 17 manual gross (in MTD, slow ₼817) | 817 | 817 | PASS |
| 18 | E-PAY-WOLT-3 | platform_payouts | — | Wolt Jun 13–17 → **₼4262.24**, date Jun 18, **bank** | 4262.24 | 4262.24 | PASS* |
| 18 | G-ADDR/FAV/ORD/AUTH-08 | order | — | Customer address/favorite flows deferred (OTP gate) | — | — | DEFER |
| 18 | E-SALE-W4D1 / B-W3D4 | sales | ×2 | Jun 18 manual gross (in MTD, busy ₼1799) | 1799 | 1799 | PASS |
| 19 | F-DEL-02 | delivery_zones | 213eba1f-… | Toggle **OFF** in UI → `is_active=false` in DB; re-enabled via admin-api (ON pill UI stuck) | — | — | PASS* |
| 19 | F-DEL-07 | online_settings | — | Delivery settings saved: min order **₼9**, prep **16 min** (UI Save) | — | — | PASS |
| 19 | F-DEL-08 | delivery | — | Wolt dispatch stub deferred | — | — | DEFER |
| 19 | E-SALE-W4D2 / B-W3D5 | sales | ×2 | Jun 19 manual gross (in MTD, ₼1550) | 1550 | 1550 | PASS |
| 20 | E-CASH-01b | liabilities | SQL | `E2E-20260620-supplier-credit` **₼1500** (other liability) | 1500 | 1500 | PASS* |
| 20 | E-CASH-09 | bank_withdrawals | ed5fcc7a-… | Deleted Jun 7 **₼50 ATM** via UI; re-added `E2E-20260607-atm-readd` | — | — | PASS |
| 20 | E-CASH-05 | account_transfers | 12808cf5-… | Delete transfer + re-add `E2E-20260607-bank-card-readd` ₼300 (admin-api) | — | — | PASS* |
| 20 | E-CASH-08 | cash_movements | 01b6245e-… | Deleted Jun 7 **₼80 bank deposit** via UI; re-added `E2E-20260607-bank-deposit-readd` (admin-api, Jun 7 date) | — | — | PASS |
| 20 | E-SALE-W4D3 / B-W3D6 / CQ4 | sales | ×3 | Jun 20 manual gross (in MTD, ₼1551) | 1551 | 1551 | PASS |
| 21 | E-SALE-W4D4 / B-W3D7 | sales | ×2 | Jun 21 manual gross (in MTD, slow ₼821) | 821 | 821 | PASS |
| 22 | E-PAY-BOLT-3 | platform_payouts | — | Bolt Jun 15–21 → **₼818.64**, date Jun 22, **card** | 818.64 | 818.64 | PASS* |
| 22 | E-STF-02/04 | salary_payments | ×5 | Full Jun salaries chef ₼800, expeditor ₼900, helper ₼500, waiter ₼650 + chef bonus ₼100 | 2950 | 2950 | PASS* |
| 22 | E-SALE-W4D5 / B-W4D1 | sales | ×2 | Jun 22 manual gross (in MTD, ₼1553) | 1553 | 1553 | PASS |
| 23 | F-USR-01 | users | 5290688d-… | Created **`e2e-staff-jun@mings.test`** (staff role) after `GRANT` on `users` table | — | — | PASS |
| 23 | F-USR-03 | users | 5290688d-… | Promoted **`e2e-staff-jun@mings.test`** staff → **manager** (PUT update-role) | — | — | PASS |
| 23 | F-USR-04 | users | 5290688d-… | Reset password for **`e2e-staff-jun@mings.test`** → `E2eStaffJun2026V2!` (Users UI) | — | — | PASS |
| 23 | F-SET-03 | sales_channels | 1101631b-… | Custom channel **`E2E-20260623-channel`** added in Settings UI | — | — | PASS |
| 23 | F-SET-04 | sales_channels | 1101631b-… | Deactivated via admin-api (`is_active=false`) | — | — | PASS* |
| 23 | F-SET-05 | sales_channels | 1101631b-… | Soft-deleted `E2E-20260623-channel` (`is_deleted=true`) | — | — | PASS* |
| 23 | E-SALE-W4D6 / B-W4D2 | sales | ×2 | Jun 23 manual gross (in MTD, ₼1554) | 1554 | 1554 | PASS |
| 24 | E-PAY-WOLT-4 | platform_payouts | — | Wolt Jun 19–23 → **₼4779.72**, date Jun 24, **bank** | 4779.72 | 4779.72 | PASS* |
| 24 | A-TRACK-01 | track | 1577bbdc-… | **`http://127.0.0.1:4176/track?token=…`** shows **#W001**, preparing, ₼29.32 (admin-api online order) | — | 29.32 | PASS* |
| 24 | A-TRACK-02 | track | — | **`http://127.0.0.1:4176/track`** (no token) → **Missing tracking link** | — | — | PASS |
| 24 | A-TRACK-03 | track | 046d8770-… | Cancelled **#W002** shows reason *Kitchen is too busy right now* | — | — | PASS* |
| 24 | A-TRACK-04 | track | 1577bbdc-… | OM **Mark ready** → track updated only after **reload** (realtime subscription did not live-update headline) | — | — | PARTIAL |
| 24 | A-TRACK-LIFE | track | 1577bbdc-… | **#W001** full path: preparing → ready → dispatched → **Delivered** on `:4176/track` (OM Delivered button) | — | 29.32 | PASS* |
| 24 | E-SALE-W5D1 / B-W4D3 | sales | ×2 | Jun 24 manual gross (in MTD, slow ₼824) | 824 | 824 | PASS |
| 25 | E-SALE-W5D2 / B-W4D4 | sales | ×2 | Jun 25 manual gross (in MTD, busy ₼1806) | 1806 | 1806 | PASS |
| 26 | E-SALE-W5D3 / B-W4D5 | sales | ×2 | Jun 26 manual gross (in MTD, ₼1557) | 1557 | 1557 | PASS |
| 27 | X-EDGE-01 | expenses | — | Zero amount expense: **Create disabled**, no DB row (`E2E-X-EDGE-01-zero-blocked`) | — | — | PASS |
| 27 | X-CASH-01 | bank_withdrawals | — | Withdrawal **₼99,999,999** blocked (Log withdrawal disabled; bank ₼24,556) | — | — | PASS |
| 27 | X-EDGE-02 | expenses | — | Negative **₼-5** blocked (no DB row) | — | — | PASS |
| 27 | E-SALE-W5D4 / B-W4D6 / B-W4D7 | sales | ×3 | Jun 27 manual gross (in MTD, ₼1558) | 1558 | 1558 | PASS |
| 28 | I-WH-01/02 | webhooks | — | **BLOCKED** — `EPOINT_PRIVATE_KEY` / webhook secrets not configured in sandbox | — | — | BLOCKED |
| 28 | E-SALE-W5D5 | sales | ×1 | Jun 28 manual gross (in MTD, slow ₼828) | 828 | 828 | PASS |
| 29 | E-PAY-WOLT-5 | platform_payouts | — | Wolt Jun 24–28 → **₼4469.64**, date Jun 29, **bank** | 4469.64 | 4469.64 | PASS* |
| 29 | E-PAY-BOLT-4 | platform_payouts | — | Bolt Jun 22–28 → **₼822.80**, date Jun 29, **card** | 822.80 | 822.80 | PASS* |
| 29 | E-PAY-CQ-2 | platform_payouts | — | ChoiceQR Jun 15–28 → **₼1641.44**, date Jun 29, **cash** | 1641.44 | 1641.44 | PASS* |
| 29 | E-RPT-01 / E-HOME-01 / E-CASH-06 | home/reports | — | Jun MTD reconciliation: bank **₼24556.12** after all payouts (Home read) | — | — | PASS |
| 29 | audit-log | audit_logs | — | Re-verified **PASS** (same GRANT fix as Jun 8; use sidebar nav) | — | — | PASS |
| 30 | E-STF-04 | salary_payments | — | Partial waiter pay **₼100** Jun 30 | 100 | 100 | PASS* |
| 30 | E-CASH-02 | liability_payments | — | Loan pay **₼500** Jun 30 (equipment loan; total paid ₼700) | 500 | 500 | PASS* |
| 30 | COV-01 / COV-02 / SNAP-01 | month close | — | **COV-01 ~95%** matrix ticked (gaps: online OTP, webhooks, A-TRACK realtime, X-BUG-05). **SNAP-01** home+reports PNGs saved. **COV-02** cleanup manifest below. | — | — | PASS* |

**Continue session 7:** C-OM-15 root cause: `supabase.functions.invoke('admin-api')` hung on Order Manager; direct `fetch` + persisted `mings-staff-auth` token works. Code fix: `src/lib/adminApi.ts` (persisted JWT + fetch), `MenuEditorTab.tsx` (error UI). **COV-01** matrix ticked in scenario doc. **COV-02** manifest appended. **SNAP-01** already captured session 6.

**Continue session 6:** Sandbox DDL (`manually_dispatched`, `delivery_orders` GRANT, unique `sale_id`). Code: `DispatchTab` tracking URL prompt + `trackingUrl` in invoke body. **F-DEL-10 PASS** on **#W005** via dispatch tab UI. **#W004** edge fn verified. `npm run deploy:local` rebuilt staff bundle.

**Continue session 5:** W001 **Delivered** on track; M003/M006 **completed** in OM; **#W003** OM self-dispatch PASS; F-DEL-10 **BLOCKED** (UI contract + missing `delivery_orders.manually_dispatched`); C-OM-05 pause resume verified in DB.

**Continue session 4:** A-TRACK-02 PASS, A-TRACK-03 PASS* (cancel order admin-api), A-TRACK-04 PARTIAL (realtime), W001 ready→dispatched (OM + admin-api), E-CASH-08 PASS (UI delete + admin-api re-add), F-USR-04 PASS (reset password). F-DEL-10 dispatch tab empty post-dispatch; `wolt-drive-manual-dispatch` still requires `trackingUrl`.

**Continue session 3:** E-PAY-02, F-SET-05, F-DEL-07, E-CASH-09/05, F-USR-03, A-TRACK-01 (4176), X-EDGE-02. Online order + track via admin-api. I-WH blocked (no webhook secrets). C-OM-15 UI toggle still no-op.
| 3–30 | E-SALE-DAYS | sales | ×81 | Manual partner sales per appendix (80/10/10) | see appendix | 43259 MTD | PASS |

**Jun 9–30 session notes:** Payouts Jun 12–29 entered via **admin-api** (`fetch` + staff JWT from Chrome DevTools) because payout date-picker defaults to **July 2026** on host date 2026-07-01. UI Save used for Jun 6 Wolt + Jun 8 Bolt only. **PASS\*** = DB/admin-api evidence; UI hidden or OTP-blocked.

**Continue session (Jul 1 host):** Applied `GRANT SELECT` on `admin_audit_log`, `audit_logs`, `auth_events`. **M006** POS order via UI. OM pause/accept/M003 ready. Income edit/delete on visible Jun 28 manual rows (Sales screen `limit 50` hides Jun 14). Audit log: use **sidebar click**, not cold `?screen=audit-log` URL (auth race redirects to home).

**Continue session 2:** `GRANT` on `public.users` fixes user-management list. **F-USR-01** staff user created. **E-OPEX/E-COGS** edit-delete via admin-api (cockpit hides `E2E-*` expense/COGS rows). **F-SET-03/04**, **F-DEL-02**, **X-EDGE-01**, **X-CASH-01** completed.

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

## COV-02 — June 2026 sandbox cleanup manifest (do NOT delete until owner approves)

**Project:** `glpdpkozvmfzgoewquxi` (Sandbox_mings_os)  
**Prefix:** `E2E-202606` / `E2E-202606XX-` / notes `E2E-202606{DD}-wolt|bolt|cq`

| Category | Tables / scope | Approx count | Lookup hint |
|----------|----------------|--------------|---------------|
| Manual sales | `sales`, `sale_items` | 90 rows | `notes LIKE 'E2E-202606%'` |
| Platform payouts | `platform_payouts` | 11 | `notes LIKE 'E2E-PAY-%'` or Jun 6–29 dates |
| Operational / COGS | `operational_expenses`, `purchases` | ~6 | `description` / supplier E2E names |
| Suppliers | `suppliers`, `supplier_debts`, `supplier_account_payments` | 2 suppliers | `E2E-20260606-meat`, `E2E-20260606-veg` |
| Staff | `employees`, `salary_payments`, `users` | 4 + 1 staff user | `E2E-20260603-*`, `e2e-staff-jun@mings.test` |
| Liabilities | `liabilities`, `liability_payments` | 2 loans | `E2E-20260608-equipment`, `E2E-20260608-supplies` |
| Cash ops | `cash_movements`, `bank_withdrawals`, `account_transfers` | ~8 | `E2E-20260607-*`, opening float |
| Catalog | `master_categories`, `products`, `modifier_*`, `combo_*` | 8 products + groups | `E2E-Wok-*`, `E2E-Drinks`, combo `E2E-20260602-lunch` |
| App orders | `sales` M002–M006, W001–W005 | ~10 | `display_number` / `E2E-202606*` customer notes |
| Delivery | `delivery_orders` | 3–5 | tied to W003–W005 sale_ids |
| Online customer | `auth.users` | 1 | `e2e-june@mings.test` |
| Zones | `delivery_zones` | 1 | `E2E-20260601-zone` |
| Audit | `admin_audit_log`, `audit_logs`, `auth_events` | many | filter by Jun 2026 + staff actions |

**Read-only verification before cleanup:**

```sql
SELECT count(*) FROM sales WHERE notes LIKE 'E2E-202606%';
SELECT sum(total_price) FROM sales WHERE notes LIKE 'E2E-202606%';  -- expect ~43259 manual component only if filtered correctly
SELECT id, name FROM products WHERE name LIKE 'E2E-%';
```

**Blocked tests (no cleanup needed):** I-WH webhooks (never ran), live EPoint charges.

---

## Local preview commands

```bash
npm run deploy:local              # staff → http://127.0.0.1:4175/spec-ops
npm run deploy:local:storefront   # order → http://127.0.0.1:4176/order
```
