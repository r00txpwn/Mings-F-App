# Functional E2E Master Catalog

**Version:** 1.0  
**Created:** 2026-06-26  
**Purpose:** Exhaustive runnable catalog — every screen, every mutating function, all surfaces.  
**Related:** [E2E Chrome DevTools policy](./E2E_CHROME_DEVTOOLS_POLICY.md) · [Phase 1 results](./functional-e2e-usecases.md) · [Missing catalog — detailed specs](./functional-e2e-missing-catalog-detailed.md) · [Dynamic/adversarial cases](./functional-e2e-dynamic-cases.md) · [Chrome re-run results](./functional-e2e-phase-chrome-results.md) · [Test ledger](./functional-e2e-test-ledger.md)

## How to use this catalog

> **Driver (mandatory):** Run every case via **`user-chrome-devtools` MCP** (Google Chrome DevTools). Not Playwright, not `cursor-ide-browser`. See [E2E_CHROME_DEVTOOLS_POLICY.md](./E2E_CHROME_DEVTOOLS_POLICY.md).

1. Run against local preview on **sandbox** (`npm run env:sandbox`): staff `http://127.0.0.1:4175/spec-ops`, storefront `http://127.0.0.1:4176/order`, kiosk `/kiosk`, KDS `/kds`, order-manager `/order-manager`.
2. Prefix all created labels: `E2E-YYYYMMDD-<group>-<short>` (e.g. `E2E-20260626-D-PROD-01`).
3. **Ledger every row** in [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md). **Delete nothing** until owner says *"clean up E2E test data"*.
4. Mark result in the **Phase 1 / Run status** column after each execution.
5. Risky cases (live card, real SMS, Users delete) stop at **external boundary** unless owner approves.

### Risk flags

| Flag | Meaning |
|------|---------|
| **Low** | Safe on production DB with E2E prefix |
| **Med** | Creates auth users or mutates shared config — use test labels |
| **High** | Real money / SMS / third-party API |
| **Boundary** | Invoke edge fn, stop before provider redirect/charge |
| **PREREQ** | Requires owner action (OTP, Google, admin account) |
| **ReadOnly** | No DB writes — verify filters/KPIs only |

### Build commands

```bash
npm run deploy:local              # staff cockpit → :4175
npm run deploy:local:storefront   # customer order → :4176
```

Confirm SHA: `http://127.0.0.1:4175/build-meta.json` vs `git rev-parse HEAD`.

---

## Master pass/fail matrix (unified)

| ID | Title | Risk | Phase 1 / Run status | Evidence / notes |
|----|-------|------|----------------------|------------------|
| **Group A — Order creation & lifecycle** |
| A-POS-01 | POS cash order (Eat In) | Low | **PASS** | #M036, ₼9.38 — legacy A1 |
| A-POS-02 | POS card + modifiers (Takeaway) | Low | **PASS** | #M037 — legacy A2 |
| A-POS-03 | POS delivery validation (negative) | Low | **PASS** | No sale row — legacy A3 |
| A-POS-04 | POS delivery happy path | Low | NOT RUN | Pin + address + `pos-order-create` |
| A-KIOSK-01 | Kiosk secret gate | Low | NOT RUN | `SecretGate.tsx` |
| A-KIOSK-02 | Kiosk Eat In / Takeout start | Low | NOT RUN | |
| A-KIOSK-03 | Kiosk category → menu navigation | Low | NOT RUN | |
| A-KIOSK-04 | Kiosk add product (simple) | Low | NOT RUN | Cart state only |
| A-KIOSK-05 | Kiosk add product (modifiers modal) | Low | NOT RUN | |
| A-KIOSK-06 | Kiosk cart qty / remove | Low | NOT RUN | |
| A-KIOSK-07 | Kiosk upsell accept / dismiss | Low | NOT RUN | |
| A-KIOSK-08 | Kiosk confirm order (full checkout) | Low | **FAIL** | 403 on `sales` insert — legacy A4 |
| A-KIOSK-09 | Kiosk confirmation + restart | Low | NOT RUN | Blocked by A-KIOSK-08 |
| A-KIOSK-10 | Kiosk 60s inactivity reset | Low | NOT RUN | See Group X |
| A-ONLINE-01 | Online COD takeaway | PREREQ | **BLOCKED** | Customer auth — legacy A5 |
| A-ONLINE-02 | Online COD delivery + zone fee | PREREQ | NOT RUN | |
| A-ONLINE-03 | Online scheduled order | PREREQ | NOT RUN | |
| A-ONLINE-04 | Online promo + tip + notes | PREREQ | NOT RUN | |
| A-ONLINE-05 | Online card checkout (boundary) | Boundary | **BLOCKED** | legacy A6 |
| A-TRACK-01 | Tracking happy path | PREREQ | **BLOCKED** | Needs track_token — legacy E1 |
| A-TRACK-02 | Tracking missing token | Low | NOT RUN | |
| A-TRACK-03 | Tracking cancelled + reason | PREREQ | NOT RUN | |
| A-TRACK-04 | Tracking realtime update | PREREQ | NOT RUN | |
| **Group B — KDS (`/kds`)** |
| B-KDS-01 | KDS staff login | Low | NOT RUN | |
| B-KDS-02 | Start preparing + prep time chips | Low | NOT RUN | `kds-order-status-update` |
| B-KDS-03 | Mark ready | Low | NOT RUN | |
| B-KDS-04 | Mark completed (bump) | Low | NOT RUN | |
| B-KDS-05 | Undo complete (5s window) | Low | NOT RUN | |
| B-KDS-06 | Toggle line item prepared | Low | NOT RUN | `kds-item-prep-toggle` |
| B-KDS-07 | Source filter + search + refresh | ReadOnly | NOT RUN | |
| B-KDS-08 | History drawer (completed today) | ReadOnly | NOT RUN | |
| **Group C — Order Manager (`/order-manager`)** |
| C-OM-01 | Kitchen pause 30 min | Med | NOT RUN | `online_settings` via admin-api |
| C-OM-02 | Kitchen pause 60 min | Med | NOT RUN | |
| C-OM-03 | Kitchen pause until next open | Med | NOT RUN | |
| C-OM-04 | Kitchen pause indefinite | Med | NOT RUN | |
| C-OM-05 | Kitchen resume | Med | NOT RUN | |
| C-OM-06 | Accept new order + prep chips | Low | NOT RUN | |
| C-OM-07 | Confirm payment (card pending) | Low | NOT RUN | |
| C-OM-08 | Reject order + each reason | Low | NOT RUN | |
| C-OM-09 | Accept scheduled order | Low | NOT RUN | |
| C-OM-10 | Mark ready (in progress) | Low | NOT RUN | |
| C-OM-11 | Picked up (takeaway/kiosk ready) | Low | NOT RUN | |
| C-OM-12 | Self dispatch | Low | NOT RUN | |
| C-OM-13 | Delivered (in delivery) | Low | NOT RUN | |
| C-OM-14 | Scheduled auto-promote (background) | Low | NOT RUN | Direct `sales.update` |
| C-OM-15 | Menu editor — kiosk visibility toggle | Med | NOT RUN | |
| C-OM-16 | Menu editor — online visibility toggle | Med | NOT RUN | |
| C-OM-17 | Menu editor — combo active toggle | Med | NOT RUN | |
| **Group D — Catalog management (cockpit)** |
| D-PROD-01 | Products — add product | Low | **FAIL** | 400: sends `category_id`, column is `master_category_id` (X-BUG-05) |
| D-PROD-02 | Products — edit product | Low | **FAIL** | Same `category_id` payload bug (X-BUG-05) |
| D-PROD-03 | Products — delete product | Med | NOT RUN | |
| D-PROD-04 | Products — add purchase (stock +) | Low | NOT RUN | |
| D-PROD-05 | Products — edit purchase | Low | NOT RUN | |
| D-PROD-06 | Products — delete purchase (stock reconcile) | Low | NOT RUN | |
| D-PROD-07 | Products — inline create product | Low | NOT RUN | |
| D-PROD-08 | Products — inline create supplier | Low | NOT RUN | |
| D-PROD-09 | Products — kiosk/online visibility in form | Low | NOT RUN | |
| D-MENU-01 | Menu — toggle kiosk visibility | Med | NOT RUN | legacy B2 |
| D-MENU-02 | Menu — toggle online visibility | Med | NOT RUN | |
| D-MENU-03 | Menu — move product up/down | Med | NOT RUN | |
| D-MENU-04 | Menu — delete product | Med | NOT RUN | |
| D-MENU-05 | Menu — duplicate product | Med | NOT RUN | |
| D-MENU-06 | Menu — add product (MenuProductForm) | Low | NOT RUN | |
| D-MENU-07 | Menu — category create/edit/delete/reorder | Med | NOT RUN | |
| D-MENU-08 | Menu — modifier library CRUD + reorder | Med | NOT RUN | |
| D-MENU-09 | Menu — assign modifiers to product | Med | NOT RUN | Direct `product_modifier_groups` |
| D-COMB-01 | Combos — create combo | Low | NOT RUN | legacy B3 |
| D-COMB-02 | Combos — active toggle (list) | Low | NOT RUN | |
| D-COMB-03 | Combos — delete combo | Med | NOT RUN | |
| D-COMB-04 | Combos — save combo fields | Low | NOT RUN | |
| D-COMB-05 | Combos — group add/save/delete | Low | NOT RUN | |
| D-COMB-06 | Combos — group item add/save/delete | Low | NOT RUN | |
| D-COMB-07 | Combos — upsell mapping | Med | NOT RUN | |
| D-SUPP-01 | Suppliers — add/save | Low | **PASS** | legacy B4 |
| D-SUPP-02 | Suppliers — delete | Med | NOT RUN | |
| D-SUPP-03 | Suppliers — active toggle | Low | NOT RUN | |
| D-SUPP-04 | Suppliers — add manual debt | Low | **PASS** | legacy B4 |
| D-SUPP-05 | Suppliers — clear debt (lump sum) | Low | **PASS** | legacy B4 |
| D-SUPP-06 | Suppliers — delete payment | Low | NOT RUN | |
| D-SUPP-07 | Suppliers — edit/delete manual debt | Low | NOT RUN | |
| **Group E — Finance & analytics (cockpit)** |
| E-SALE-01 | Sales — create manual partner sale | Low | **PASS** | legacy C1 |
| E-SALE-02 | Sales — edit manual sale | Low | NOT RUN | |
| E-SALE-03 | Sales — delete manual sale | Med | NOT RUN | |
| E-OPEX-01 | Expenses — create operational expense | Low | **PASS** | legacy C2 |
| E-OPEX-02 | Expenses — edit operational expense | Low | NOT RUN | |
| E-OPEX-03 | Expenses — delete operational expense | Low | NOT RUN | |
| E-COGS-01 | Expenses COGS — create purchase | Low | NOT RUN | |
| E-COGS-02 | Expenses COGS — edit purchase | Low | NOT RUN | |
| E-COGS-03 | Expenses COGS — delete purchase | Low | NOT RUN | |
| E-COGS-04 | Expenses COGS — on-account vs paid now | Low | NOT RUN | |
| E-CAT-01 | Expenses — add/save category | Low | **PASS** | legacy C2 |
| E-CAT-02 | Expenses — delete category | Med | NOT RUN | |
| E-CAT-03 | Expenses — sub-item add/save/delete | Low | NOT RUN | |
| E-PAY-01 | Payouts — add payout | Low | **PASS** | legacy C3 |
| E-PAY-02 | Payouts — update payout | Low | NOT RUN | |
| E-PAY-03 | Payouts — delete payout | Med | NOT RUN | |
| E-CASH-01 | Cash & Debt — add liability | Low | NOT RUN | legacy C4 |
| E-CASH-02 | Cash & Debt — record liability payment | Low | NOT RUN | |
| E-CASH-03 | Cash & Debt — log bank withdrawal | Low | NOT RUN | |
| E-CASH-04 | Cash & Debt — add cash movement | Low | NOT RUN | |
| E-CASH-05 | Cash & Debt — delete cash movement | Low | NOT RUN | |
| E-CASH-06 | Cash drawer cross-check math | Low | **PASS** | legacy C5 — ₼184.38 |
| E-PAYM-01 | Payments — recheck payment | Boundary | NOT RUN | legacy C6 |
| E-HOME-01 | Home — date/source/compare filters | ReadOnly | NOT RUN | KPI sanity |
| E-MONY-01 | Money — tab views (sales/COGS/opex) | ReadOnly | NOT RUN | |
| E-RPT-01 | Reports — date/source filters + KPIs | ReadOnly | NOT RUN | |
| E-LOC-01 | Order Locations — date/source map | ReadOnly | NOT RUN | |
| **Group F — Configuration & access (cockpit)** |
| F-SET-01 | Settings — language (user_preferences) | Low | NOT RUN | |
| F-SET-02 | Settings — theme toggle | Low | NOT RUN | Local only |
| F-SET-03 | Settings — add sales channel | Med | NOT RUN | legacy D1 |
| F-SET-04 | Settings — toggle channel active | Med | NOT RUN | |
| F-SET-05 | Settings — delete channel (soft) | Med | NOT RUN | Protected channels blocked |
| F-DEL-01 | Delivery zones — create/save | Med | NOT RUN | legacy D2 |
| F-DEL-02 | Delivery zones — toggle active | Med | NOT RUN | |
| F-DEL-03 | Delivery zones — delete | Med | NOT RUN | |
| F-DEL-04 | Delivery settings — kitchen open/close | Med | NOT RUN | legacy D3 |
| F-DEL-05 | Delivery settings — cancel pause | Med | NOT RUN | |
| F-DEL-06 | Delivery settings — delivery/takeaway toggles | Med | NOT RUN | |
| F-DEL-07 | Delivery settings — save hours/min/prep/coords | Med | NOT RUN | |
| F-DEL-08 | Dispatch — Wolt create (stub) | Low | NOT RUN | `wolt-drive-create` |
| F-DEL-09 | Dispatch — Wolt cancel (stub) | Low | NOT RUN | |
| F-DEL-10 | Dispatch — manual dispatch + tracking URL | Low | NOT RUN | |
| F-USR-01 | Users — create user | Med | NOT RUN | PREREQ admin |
| F-USR-02 | Users — delete user | High | **BLOCKED** | legacy D4 |
| F-USR-03 | Users — change role | Med | NOT RUN | |
| F-USR-04 | Users — reset password | Med | NOT RUN | |
| **Group G — Customer account (`/order`)** |
| G-AUTH-01 | Email sign in | PREREQ | NOT RUN | |
| G-AUTH-02 | Email sign up | PREREQ | NOT RUN | |
| G-AUTH-03 | Forgot password | PREREQ | NOT RUN | |
| G-AUTH-04 | Reset password (recovery link) | PREREQ | NOT RUN | |
| G-AUTH-05 | Google OAuth sign in | PREREQ | NOT RUN | |
| G-AUTH-06 | Send SMS OTP | High | NOT RUN | `rpc_request_phone_otp` |
| G-AUTH-07 | Verify SMS OTP | High | NOT RUN | |
| G-AUTH-08 | Sign out | Low | NOT RUN | |
| G-PROF-01 | Save customer profile | PREREQ | NOT RUN | `customer_profiles` |
| G-PROF-02 | Google profile completion modal | PREREQ | NOT RUN | |
| G-ADDR-01 | Add address | PREREQ | NOT RUN | |
| G-ADDR-02 | Edit address | PREREQ | NOT RUN | |
| G-ADDR-03 | Set default address | PREREQ | NOT RUN | |
| G-ADDR-04 | Delete address | PREREQ | NOT RUN | |
| G-FAV-01 | Toggle favorite product | PREREQ | NOT RUN | |
| G-ORD-01 | Reorder from history | PREREQ | NOT RUN | Cart only |
| G-CART-01 | Add/remove/qty/notes (client cart) | Low | NOT RUN | localStorage |
| G-COOK-01 | Cookie consent accept | Low | NOT RUN | |
| **Group H — Order Support + Kiosk Orders (cockpit)** |
| H-SUP-01 | Order Support — confirm payment | Low | NOT RUN | |
| H-SUP-02 | Order Support — accept + prep time | Low | NOT RUN | |
| H-SUP-03 | Order Support — quick prepare 15m | Low | NOT RUN | |
| H-SUP-04 | Order Support — reject + reason | Low | NOT RUN | |
| H-SUP-05 | Order Support — mark ready | Low | NOT RUN | |
| H-SUP-06 | Order Support — self dispatch | Low | NOT RUN | |
| H-SUP-07 | Order Support — picked up | Low | NOT RUN | |
| H-SUP-08 | Order Support — delivered | Low | NOT RUN | |
| H-KOB-01 | Kiosk Orders — drag status change | Low | NOT RUN | |
| H-KOB-02 | Kiosk Orders — confirm payment | Low | **PASS** | legacy A8 — M036 PAID |
| H-KOB-03 | Kiosk Orders — save Wolt tracking URL | Low | NOT RUN | |
| H-KOB-04 | Kiosk Orders — Wolt book lock | Low | NOT RUN | |
| H-STM-01 | Full state machine Accept→Completed | Low | **PARTIAL** | legacy A7 — payment only |
| **Group I — Payment webhooks/reconcile (controlled HTTP)** |
| I-WH-01 | EPoint webhook (mock signed payload) | Boundary | NOT RUN | |
| I-WH-02 | United Payment webhook (mock) | Boundary | NOT RUN | |
| I-WH-03 | United Payment return (GET redirect) | Boundary | NOT RUN | |
| I-WH-04 | payment-reconcile (secret bearer) | Boundary | NOT RUN | |
| I-WH-05 | united-payment-status-check | Boundary | NOT RUN | |

**Phase 1 summary (carried forward):** 11 PASS · 1 FAIL · 1 PARTIAL · 4 BLOCKED · remainder NOT RUN  
**Master catalog total:** 147 use cases (Groups A–I) + Group X in [dynamic cases doc](./functional-e2e-dynamic-cases.md)  
**Missing detailed specs:** 118 cases in [functional-e2e-missing-catalog-detailed.md](./functional-e2e-missing-catalog-detailed.md) (everything still NOT RUN / BLOCKED as of Chrome re-run)

---

## Group A — Order creation & lifecycle

**Surfaces:** POS (`src/pos/PosNewOrderView.tsx`), Kiosk (`src/kiosk/*`), Order (`src/order/OrderApp.tsx`), Tracking (`src/order/TrackingApp.tsx`)

### A-POS — Point of Sale

| ID | Steps | Expected | Backend | File |
|----|-------|----------|---------|------|
| A-POS-01 | New Order → Eat In → pick item → Cash → Create | Success screen #M###, `payment_method=cash` | Edge **`pos-order-create`** → `sales`, `sale_items`, `sale_item_modifiers` | `PosNewOrderView.tsx` |
| A-POS-02 | Takeaway → item with modifiers → Card → Create | #M###, card, modifiers on lines | same | same |
| A-POS-03 | Delivery → submit without pin/address | Inline error, no sale created | Client validation only | same |
| A-POS-04 | Delivery → set pin + address → Cash → Create | #M###, delivery fields populated | **`pos-order-create`** | same |

### A-KIOSK — In-store self-service

| ID | Steps | Expected | Backend | File |
|----|-------|----------|---------|------|
| A-KIOSK-01 | Navigate `/kiosk` with secret | Gate passes, idle screen | — | `SecretGate.tsx` |
| A-KIOSK-02 | Tap Eat In or Take Out | Categories screen | — | `IdleScreen.tsx` |
| A-KIOSK-03 | Select category | Menu for category | — | `CategoryScreen.tsx` |
| A-KIOSK-04 | Tap product without required mods | Line in cart | Client state | `KioskApp.tsx` |
| A-KIOSK-05 | Tap product with mods → customize → add | Line with modifiers | Client state | `ProductDetailModal.tsx` |
| A-KIOSK-06 | Cart: +/- qty, remove line | Totals update | Client state | `CartScreen.tsx` |
| A-KIOSK-07 | Upsell modal: add / dismiss | Cart updated or unchanged | Client state | `UpsellModal.tsx` |
| A-KIOSK-08 | Checkout → Confirm Order | Confirmation #M###, `source=kiosk` | RPC **`allocate_direct_display_number`**; direct insert **`sales`**, **`sale_items`**, **`sale_item_modifiers`** | `CheckoutScreen.tsx` |
| A-KIOSK-09 | Confirmation countdown → Done | Returns idle, cart cleared | — | `ConfirmationScreen.tsx` |
| A-KIOSK-10 | Wait 60s on any step | Idle reset, cart cleared | — | `KioskApp.tsx` |

### A-ONLINE — Customer order app

| ID | Steps | Expected | Backend | File |
|----|-------|----------|---------|------|
| A-ONLINE-01 | Auth → Menu → Cart → Checkout COD takeaway → Place | Confirmation + track link | Edge **`online-order-create`** | `OrderApp.tsx` |
| A-ONLINE-02 | Delivery → valid address in zone → COD | Delivery fee on total | same + zone read | `OrderCheckoutView.tsx` |
| A-ONLINE-03 | Schedule for future slot → Place | `scheduled_for` set | **`online-order-create`** | same |
| A-ONLINE-04 | Apply promo, tip, order notes → Place | Fields persisted on sale | same | same |
| A-ONLINE-05 | Card payment → Place → redirect URL returned | `nextStep` payment init; **stop before provider** | **`united-payment-create-payment`** or **`epoint-create-payment`** | `OrderApp.tsx` |

### A-TRACK — Order tracking

| ID | Steps | Expected | Backend | File |
|----|-------|----------|---------|------|
| A-TRACK-01 | Open `/track?token=<from A-ONLINE-01>` | Timeline + line items | RPC **`get_sale_tracking_public`** | `TrackingApp.tsx` |
| A-TRACK-02 | Open `/track` without token | Missing-token message | — | same |
| A-TRACK-03 | Token for cancelled order with reason | Cancelled UI + reason | RPC read | same |
| A-TRACK-04 | Keep page open; staff marks ready in OM | Timeline updates via realtime | `sales` subscription | same |

---

## Group B — KDS (`/kds`)

**Entry:** `src/kds/KitchenDisplay.tsx`

| ID | Control (`t.*`) | Handler | Backend |
|----|-----------------|---------|---------|
| B-KDS-01 | Sign in | `signIn` | Supabase Auth |
| B-KDS-02 | Start preparing + prep chips | `handleUpdateStatus('preparing', prepMinutes)` | Edge **`kds-order-status-update`** |
| B-KDS-03 | Mark ready | `handleUpdateStatus('ready')` | same |
| B-KDS-04 | Mark completed | `handleUpdateStatus('completed')` | same |
| B-KDS-05 | Undo (toast) | `handleUndoComplete` | same → `ready` |
| B-KDS-06 | Item prepared toggle | `handleToggleItemPrep` | Edge **`kds-item-prep-toggle`** |
| B-KDS-07 | Filter/search/refresh | `setSourceFilter`, `loadOrders` | Read `sales` |
| B-KDS-08 | History drawer | `setHistoryOpen` | Read completed `sales` |

---

## Group C — Order Manager (`/order-manager`)

**Entry:** `src/order-manager/OrderManagerApp.tsx`

| ID | Control | Handler | Backend |
|----|---------|---------|---------|
| C-OM-01–05 | Kitchen pause buttons | `applyPatch` on `online_settings` | **`admin-api`** |
| C-OM-06 | Accept new | `acceptNew` | `sales` update |
| C-OM-07 | Confirm payment | `buildMarkPaidPatch` | `sales` |
| C-OM-08 | Reject + reason options | `rejectOrder` | `sales` cancelled |
| C-OM-09 | Accept scheduled | `acceptScheduled` | `sales.reminder_at` |
| C-OM-10 | Mark ready | `updateSale` | `sales` ready |
| C-OM-11 | Picked up | `updateSale` | `sales` completed |
| C-OM-12 | Self dispatch | `selfDispatch` | `sales` dispatched |
| C-OM-13 | Delivered | `updateSale` | `sales` completed |
| C-OM-14 | Wait for scheduled due time | `promoteDueScheduled` | Direct `sales.update` |
| C-OM-15–17 | Menu editor toggles | `toggleProduct` / `toggleCombo` | `products`, `combo_deals` |

---

## Group D — Catalog management

**Screens:** `?screen=products`, `menu-builder`, `combos`, `suppliers`  
**Backend:** Mostly **`admin-api`**; modifier assign uses direct `product_modifier_groups` (`ProductModifierAssigner.tsx`).

See master matrix above for full ID list. Key files:

- Products: `src/screens/ProductsScreen.tsx`
- Menu: `src/screens/MenuScreen.tsx`, `MenuProductForm.tsx`, `MenuCategoryManager.tsx`, `ProductModifierEditor.tsx`
- Combos: `src/screens/CombosScreen.tsx`
- Suppliers: `src/screens/SuppliersScreen.tsx`

---

## Group E — Finance & analytics

**Screens:** `sales`, `expenses`, `payouts`, `liabilities`, `payments`, `home`, `money`, `reports`, `order-locations`

| Screen | Mutations | Read-only checks |
|--------|-----------|------------------|
| Sales | create / edit / delete manual sale | — |
| Expenses | opex + COGS + categories | — |
| Payouts | add / update / delete | Commission preview from `sales` |
| Cash & Debt | liability, withdrawal, cash movements | Cash drawer KPI cross-check |
| Payments | recheck button | Filters + realtime list |
| Home | — | Date, source, compare period, channel chips |
| Money | — | Sales / COGS / opex tabs |
| Reports | — | KPIs, channel breakdown |
| Order Locations | — | Map pins by date/source |

---

## Group F — Configuration & access

**Screens:** `settings`, `delivery` (tabs: zones, settings, dispatch), `users`

| Screen | Mutations |
|--------|-----------|
| Settings | language → `user_preferences`; channels CRUD → `sales_channels` |
| Delivery zones | `delivery_zones` CRUD |
| Delivery settings | `online_settings` |
| Dispatch | `wolt-drive-create`, `wolt-drive-cancel`, `wolt-drive-manual-dispatch` |
| Users | `user-management` edge (admin only) |

---

## Group G — Customer account

**Surface:** `/order` — account panel + checkout inline auth  
**Tables:** `customer_profiles`, `customer_addresses`, `customer_favorites`, Auth

All G-* cases require authenticated customer session unless testing cookie/consent (G-COOK-01, G-CART-01).

---

## Group H — Order Support + Kiosk Orders

**Screens:** `?screen=order-support`, `?screen=kiosk-orders`  
**Files:** `AdminOrderSupportScreen.tsx`, `KioskOrdersScreen.tsx`, `KioskOrdersBoard.tsx`

Full order lifecycle should be exercised on a **dedicated test order** (not production customer orders):

```
pending → preparing → ready → dispatched → completed
         └→ cancelled (reject with reason)
```

**Known defect (formalized in Group X):** POS orders may appear as source "KIOSK" in Kiosk Orders; Order Support source filter may omit POS.

---

## Group I — Payment webhooks/reconcile

**No UI** — HTTP tests against edge functions with signed/mock payloads.

| ID | Endpoint | Auth | Writes |
|----|----------|------|--------|
| I-WH-01 | `/functions/v1/epoint-webhook` | EPoint signature | `online_payments`, `sales`, `saved_cards` |
| I-WH-02 | `/functions/v1/united-payment-webhook` | X-Signature | same |
| I-WH-03 | `/functions/v1/united-payment-return` | GET redirect | same |
| I-WH-04 | `/functions/v1/payment-reconcile` | `PAYMENT_RECONCILE_SECRET` | + `payment_reconciliation_log` |
| I-WH-05 | `/functions/v1/united-payment-status-check` | same secret | `online_payments`, `sales` |

Use a sale created by A-ONLINE-05 (card init, not completed) as fixture.

---

## Appendix A — Screen coverage (Pass 1)

| Surface | Route | Screen / step | Catalog IDs |
|---------|-------|---------------|-------------|
| Staff cockpit | `/spec-ops?screen=home` | Home | E-HOME-01 |
| | `order-support` | Order Support | H-SUP-01–08 |
| | `kiosk-orders` | Kiosk Orders board | H-KOB-01–04, H-STM-01 |
| | `delivery` | Zones / Settings / Dispatch | F-DEL-01–10 |
| | `order-locations` | Order Locations map | E-LOC-01 |
| | `menu-builder` | Menu Builder | D-MENU-01–09 |
| | `combos` | Combos | D-COMB-01–07 |
| | `products` | Products | D-PROD-01–09 |
| | `suppliers` | Suppliers | D-SUPP-01–07 |
| | `sales` | Sales | E-SALE-01–03 |
| | `payments` | Payments | E-PAYM-01 |
| | `liabilities` | Cash & Debt | E-CASH-01–06 |
| | `money` | Money | E-MONY-01 |
| | `expenses` | Expenses | E-OPEX-*, E-COGS-*, E-CAT-* |
| | `payouts` | Payouts | E-PAY-01–03 |
| | `reports` | Reports | E-RPT-01 |
| | `users` | Users | F-USR-01–04 |
| | `settings` | Settings | F-SET-01–05 |
| | (auth) | Login / Access denied | B-KDS-01, C-OM-* login |
| Customer | `/order` | Browse / Cart / Checkout / Done | A-ONLINE-*, G-* |
| | `/track` | Tracking views | A-TRACK-* |
| Kiosk | `/kiosk` | Idle → Confirm | A-KIOSK-* |
| KDS | `/kds` | Board + history | B-KDS-* |
| Order Manager | `/order-manager` | Active / Past / Menu | C-OM-* |
| POS | (staff POS route) | New order | A-POS-* |

**Coverage:** 18/18 cockpit screens + 6 surfaces + Login = **100%**

---

## Appendix B — Function coverage (Pass 2)

Every mutating control from codebase audit maps to ≥1 catalog ID. Summary by backend path:

| Backend path | Catalog IDs |
|--------------|-------------|
| `pos-order-create` | A-POS-01–04 |
| Kiosk direct `sales` insert | A-KIOSK-08 |
| `online-order-create` | A-ONLINE-01–04 |
| `epoint-create-payment` / `united-payment-create-payment` | A-ONLINE-05 |
| `kds-order-status-update` | B-KDS-02–05 |
| `kds-item-prep-toggle` | B-KDS-06 |
| `admin-api` → `sales` | C-OM-06–13, H-SUP-*, H-KOB-* |
| `admin-api` → catalog tables | D-* |
| `admin-api` → finance tables | E-* |
| `admin-api` → config tables | F-SET-03–05, F-DEL-01–07 |
| Wolt edge fns | F-DEL-08–10, H-KOB-03–04 |
| `user-management` | F-USR-* |
| Customer direct writes | G-* |
| Payment webhooks | I-WH-* |
| RPC `allocate_direct_display_number` | A-KIOSK-08, A-ONLINE-* |
| RPC `rpc_request_phone_otp` | G-AUTH-06 |
| RPC `expire_online_kitchen_pause_if_due` | C-OM-14 (load side-effect), F-DEL-04 |
| RPC `get_sale_tracking_public` | A-TRACK-* |
| `user_preferences` | F-SET-01 |
| `product_modifier_groups` direct | D-MENU-09 |
| Scheduled promote direct update | C-OM-14 |

**Coverage:** All audited mutating controls = **100%**

---

## Appendix C — Backend coverage (Pass 3)

### Edge functions (20)

| Function | Catalog ID | Notes |
|----------|------------|-------|
| `admin-api` | D-*, E-*, F-*, H-*, C-OM-* | Primary staff bus |
| `admin-payment-recheck` | E-PAYM-01 | |
| `online-order-create` | A-ONLINE-01–04 | |
| `pos-order-create` | A-POS-01–04 | |
| `kds-order-status-update` | B-KDS-02–05 | |
| `kds-item-prep-toggle` | B-KDS-06 | |
| `epoint-create-payment` | A-ONLINE-05 | Boundary |
| `united-payment-create-payment` | A-ONLINE-05 | Boundary |
| `wolt-drive-create` | F-DEL-08 | Stub |
| `wolt-drive-cancel` | F-DEL-09 | Stub |
| `wolt-drive-manual-dispatch` | F-DEL-10, H-KOB-03 | |
| `wolt-dispatch-book-lock` | H-KOB-04 | |
| `user-management` | F-USR-* | |
| `epoint-webhook` | I-WH-01 | |
| `united-payment-webhook` | I-WH-02 | |
| `united-payment-return` | I-WH-03 | |
| `payment-reconcile` | I-WH-04 | |
| `united-payment-status-check` | I-WH-05 | |
| `wolt-drive-webhook` | Group X (X-PAY-03 replay) | Provider-only |
| `wolt-drive-check` | **N/A** | Read-only, no writes |

### RPCs (4)

| RPC | Catalog ID |
|-----|------------|
| `allocate_direct_display_number` | A-KIOSK-08, A-ONLINE-* |
| `rpc_request_phone_otp` | G-AUTH-06 |
| `expire_online_kitchen_pause_if_due` | F-DEL-04 load, C-OM-14 |
| `get_sale_tracking_public` | A-TRACK-* — **verify exists in deployed DB** (no local migration) |

### Direct table writes (frontend)

| Table | Catalog ID |
|-------|------------|
| `sales` | A-KIOSK-08, C-OM-14 |
| `sale_items` / `sale_item_modifiers` | A-KIOSK-08 |
| `customer_profiles` | G-PROF-* |
| `customer_addresses` | G-ADDR-* |
| `customer_favorites` | G-FAV-01 |
| `user_preferences` | F-SET-01 |
| `product_modifier_groups` | D-MENU-09 |

### Dead / unused paths (explicit)

| Path | Status |
|------|--------|
| `adminUpsert` (`adminApi.ts`) | **N/A** — exported, never called |
| `transactions` table via admin-api | **N/A** — allowlisted, no frontend caller |
| `ComboBuilder.tsx` | **N/A** — not mounted in runtime |
| OM Wolt Drive button | **N/A** — disabled (`omWoltDriveComingSoon`) |

**Coverage:** 18/20 edge fns exercised + 2 N/A documented = **100%**

---

## Execution phases (after catalog approval)

| Phase | Scope | Prereqs |
|-------|-------|---------|
| 2a | Groups D, E, F (minus Users), H | Staff login |
| 2b | Groups B, C | Staff login + test orders |
| 2c | Groups A-ONLINE, A-TRACK, G | Owner customer auth |
| 2d | Group X dynamic cases | Mixed |
| 2e | Group I webhooks | Test sale fixture + secrets |

Update [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md) after each phase.
