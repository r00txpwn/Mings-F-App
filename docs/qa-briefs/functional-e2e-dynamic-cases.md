# Functional E2E — Dynamic & Adversarial Cases (Group X)

**Version:** 1.1  
**Created:** 2026-06-26  
**Updated:** 2026-06-26 — all 57 cases expanded to full depth (+ X-BUG-06/07 from Chrome run)  
**Purpose:** Failure-hunting use cases — edge conditions, concurrency, and defects not covered by happy-path catalog.  
**Parent catalog:** [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) · **Missing happy-path detail:** [functional-e2e-missing-catalog-detailed.md](./functional-e2e-missing-catalog-detailed.md)

These cases are **invented** to surface breakage before customers or staff hit it in production. Run after Groups A–I baseline, or in parallel when investigating regressions.

---

## How to run

1. Use E2E prefix: `E2E-YYYYMMDD-X-<slug>`.
2. Ledger outcomes in [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md) — including **failed** attempts (they may still create partial rows).
3. Capture: console errors, network tab (403/409/500), screenshot, before/after DB state if safe.
4. Mark **Expected behavior** vs **Actual** — a case "passes" if the system handles the edge gracefully; it "fails" if data corruption, silent wrong totals, or unhandled errors occur.

### Per-case template (full depth)

Each spec below includes: **Surface/URL**, **Risk**, **Preconditions**, **Steps**, **Expected**, **Backend**, **DB verify** (read-only SQL), **Evidence**, **Linked** master IDs.

---

## Master matrix — Group X

| ID | Category | Title | Risk | Run status |
|----|----------|-------|------|------------|
| **Concurrency & race** |
| X-RACE-01 | Concurrency | Two staff confirm payment on same order simultaneously | Low | NOT RUN |
| X-RACE-02 | Concurrency | Two staff drag same order to different columns | Low | NOT RUN |
| X-RACE-03 | Concurrency | Kiosk + online checkout at same second (display number) | Med | NOT RUN |
| X-RACE-04 | Concurrency | Double-click Place Order (online) | Low | NOT RUN |
| X-RACE-05 | Concurrency | Double-click Confirm Order (kiosk) | Low | NOT RUN |
| X-RACE-06 | Concurrency | Double-click Create Order (POS) | Low | NOT RUN |
| **Kitchen & availability state** |
| X-KIT-01 | Kitchen | Place online order while kitchen paused (30m) | Med | NOT RUN |
| X-KIT-02 | Kitchen | Place online order while pause `offline_until` in future | Med | NOT RUN |
| X-KIT-03 | Kitchen | Place online order while paused indefinitely | Med | NOT RUN |
| X-KIT-04 | Kitchen | Resume kitchen mid-checkout (customer tab open) | Med | NOT RUN |
| X-KIT-05 | Kitchen | Scheduled order due — auto-promote fires | Low | NOT RUN |
| X-KIT-06 | Kitchen | Pause from OM while customer on checkout step 5 | Med | NOT RUN |
| **Cart & menu integrity** |
| X-CART-01 | Cart | Required modifier not selected — submit blocked | Low | NOT RUN |
| X-CART-02 | Cart | Combo group min selections not met | Low | NOT RUN |
| X-CART-03 | Cart | Combo group max selections exceeded | Low | NOT RUN |
| X-CART-04 | Cart | 50+ line items in cart | Low | NOT RUN |
| X-CART-05 | Cart | Reorder item that was deleted from menu | PREREQ | NOT RUN |
| X-CART-06 | Cart | Reorder item hidden from online channel | PREREQ | NOT RUN |
| X-CART-07 | Cart | Add kiosk-only product on online surface (should fail/hide) | Low | NOT RUN |
| X-CART-08 | Cart | Modify cart after kitchen closed error shown | Med | NOT RUN |
| X-CART-09 | Cart | Empty cart → checkout blocked | Low | NOT RUN |
| X-CART-10 | Cart | Browser back from confirmation → cart state | Low | NOT RUN |
| **Money & ledger math** |
| X-MNY-01 | Money | COD + tip + promo + delivery fee — total matches receipt | PREREQ | NOT RUN |
| X-MNY-02 | Money | Payout commission on odd decimal (e.g. ₼33.33) | Low | NOT RUN |
| X-MNY-03 | Money | Cash drawer after movement delete — recalc correct | Low | NOT RUN |
| X-MNY-04 | Money | Supplier clear debt > owed (overpay attempt) | Low | NOT RUN |
| X-MNY-05 | Money | Delete expense category with active expenses | Med | NOT RUN |
| X-MNY-06 | Money | Soft-delete channel still referenced by today's sales | Med | NOT RUN |
| X-MNY-07 | Money | Manual sale edit changes Home KPI for same date | Low | NOT RUN |
| X-MNY-08 | Money | Confirm payment twice on cash order | Low | NOT RUN |
| X-MNY-09 | Money | COGS purchase delete restores product quantity | Low | NOT RUN |
| **Payment edge** |
| X-PAY-01 | Payment | Card checkout redirect — never return (abandoned) | Boundary | NOT RUN |
| X-PAY-02 | Payment | Duplicate webhook delivery (idempotency) | Boundary | NOT RUN |
| X-PAY-03 | Payment | Webhook arrives before return URL | Boundary | NOT RUN |
| X-PAY-04 | Payment | Recheck on already-paid row | Boundary | NOT RUN |
| X-PAY-05 | Payment | Recheck on failed/expired session | Boundary | NOT RUN |
| **Auth & security** |
| X-SEC-01 | Security | OTP resend within 45s cooldown | High | NOT RUN |
| X-SEC-02 | Security | Mutation with expired staff JWT mid-save | Med | NOT RUN |
| X-SEC-03 | Security | Kiosk anon `sales` insert (reproduce A-KIOSK-08 403) | Low | **FAIL** |
| X-SEC-04 | Security | Customer A reads customer B address (RLS) | PREREQ | NOT RUN |
| X-SEC-05 | Security | XSS in customer name / order notes | Low | NOT RUN |
| X-SEC-06 | Security | Emoji + 500-char name on POS order | Low | NOT RUN |
| X-SEC-07 | Security | Non-staff JWT on admin-api | Med | NOT RUN |
| X-SEC-08 | Security | Non-admin on Users screen | Low | **BLOCKED** |
| **Realtime & stale UI** |
| X-RT-01 | Realtime | KDS bump while OM drawer open on same order | Low | NOT RUN |
| X-RT-02 | Realtime | Tracking page open during status transitions | PREREQ | NOT RUN |
| X-RT-03 | Realtime | Payments list updates on webhook (realtime sub) | Boundary | NOT RUN |
| X-RT-04 | Realtime | Kiosk Orders board drag after another user moved card | Low | NOT RUN |
| **Time & boundary** |
| X-TIME-01 | Boundary | "Today" filter at Asia/Baku midnight rollover | Low | NOT RUN |
| X-TIME-02 | Boundary | Scheduled order in the past (reject or promote?) | Med | NOT RUN |
| X-TIME-03 | Boundary | Display number M999 → next M001 rollover | Med | NOT RUN |
| X-TIME-04 | Boundary | Kiosk 60s inactivity mid-checkout | Low | NOT RUN |
| X-TIME-05 | Boundary | Delivery zone polygon edge — pin on boundary | Low | NOT RUN |
| X-TIME-06 | Boundary | Min order not met for delivery | Low | NOT RUN |
| **i18n & display** |
| X-I18N-01 | i18n | Place order in AZ — KDS shows correct labels | PREREQ | NOT RUN |
| X-I18N-02 | i18n | Place order in RU — OM status buttons | PREREQ | NOT RUN |
| X-I18N-03 | i18n | Switch language mid-checkout | Low | NOT RUN |
| X-I18N-04 | i18n | No raw translation keys in confirmation email/UI | PREREQ | NOT RUN |
| **Known defects (formalized)** |
| X-BUG-01 | Known | Kiosk checkout 403 on `sales` insert | Low | **FAIL** |
| X-BUG-02 | Known | POS orders labeled "KIOSK" in Kiosk Orders / OM | Low | NOT RUN |
| X-BUG-03 | Known | Order Support source filter missing POS | Low | NOT RUN |
| X-BUG-04 | Known | `get_sale_tracking_public` RPC missing in repo migrations | Low | NOT RUN |
| X-BUG-05 | Known | Products screen sends `category_id` not `master_category_id` | Low | **FAIL** |
| X-BUG-06 | Known | OM completion writes missing `completed_at` column | Low | **FAIL** |
| X-BUG-07 | Known | Products category dropdown queries dead `categories` table | Low | **FAIL** |

**Group X total:** 57 cases (55 original + X-BUG-06/07)

---

## Detailed case specs — Concurrency & race

### X-RACE-01 — Dual confirm payment

| | |
|---|---|
| **Surface** | `?screen=kiosk-orders` (two staff sessions) |
| **Risk** | Low |
| **Preconditions** | One unpaid cash order `#M###` (e.g. from kiosk COD). |
| **Steps** | 1. Session A + B: open same order. 2. Both click **Confirm payment** within 1s. |
| **Expected** | Exactly one PAID transition; second idempotent or clear error; cash drawer credited once. |
| **Backend** | `buildMarkPaidPatch` → **`admin-api`** → `sales.paid_at` |
| **DB verify** | `SELECT payment_status, paid_at FROM sales WHERE id = '<sale_id>';` — single `paid_at` |
| **Evidence** | Two network tabs; cash drawer before/after |
| **Linked** | H-KOB-02, X-MNY-08 |

### X-RACE-02 — Dual drag same order

| | |
|---|---|
| **Surface** | `?screen=kiosk-orders` |
| **Steps** | 1. Two sessions drag same card to different columns simultaneously. |
| **Expected** | One wins; other reverts or shows conflict; no duplicate status timestamps. |
| **DB verify** | `SELECT order_status, updated_at FROM sales WHERE id = '<sale_id>';` |

### X-RACE-03 — Display number collision

| | |
|---|---|
| **Surface** | `/kiosk` + `/order` simultaneously |
| **Risk** | Med |
| **Steps** | 1. Trigger kiosk **Confirm Order** + online **Place Order** at same second. |
| **Expected** | Two distinct `display_number` values; no unique constraint violation. |
| **Backend** | RPC **`allocate_direct_display_number`** |
| **DB verify** | `SELECT display_number, source, created_at FROM sales WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at;` |

### X-RACE-04 — Double-click Place Order (online)

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` checkout |
| **Steps** | 1. Rapid double-click **Place Order**. |
| **Expected** | Single sale; button disabled after first click. |
| **DB verify** | `SELECT COUNT(*) FROM sales WHERE customer_phone = '<phone>' AND created_at > NOW() - INTERVAL '2 minutes';` → 1 |

### X-RACE-05 — Double-click Confirm Order (kiosk)

| | |
|---|---|
| **Surface** | `/kiosk` checkout |
| **Steps** | 1. Rapid double-click **Confirm Order**. |
| **Expected** | Single sale or clear error; no duplicate M-numbers. |
| **Linked** | X-BUG-01 |

### X-RACE-06 — Double-click Create Order (POS)

| | |
|---|---|
| **Surface** | `/pos` |
| **Steps** | 1. Rapid double-click **Create Order**. |
| **Expected** | Single sale from **`pos-order-create`**. |
| **DB verify** | Count sales in last 2 minutes for same total/notes |

---

## Detailed case specs — Kitchen & availability

### X-KIT-01 — Order while paused 30m

| | |
|---|---|
| **Surface** | OM + `/order` |
| **Steps** | 1. OM → **Pause 30 min**. 2. Customer completes checkout → **Place Order**. |
| **Expected** | Kitchen closed message; no sale OR blocked per product rules. |
| **DB verify** | `SELECT is_open, offline_until FROM online_settings LIMIT 1;` |
| **Linked** | C-OM-01, F-DEL-04 |

### X-KIT-02 — Order while `offline_until` future

| | |
|---|---|
| **Steps** | 1. Pause with specific future `offline_until`. 2. Attempt online order. |
| **Expected** | Blocked until window expires. |
| **DB verify** | `SELECT offline_until FROM online_settings WHERE is_open = false;` |

### X-KIT-03 — Order while paused indefinitely

| | |
|---|---|
| **Steps** | 1. **Pause indefinitely**. 2. Attempt online order. |
| **Expected** | Persistent closed state; clear UX. |
| **Linked** | C-OM-04 |

### X-KIT-04 — Resume mid-checkout

| | |
|---|---|
| **Steps** | 1. Customer on checkout step 4 with closed banner. 2. Staff **Resume** kitchen. 3. Customer **Place Order**. |
| **Expected** | Order succeeds; stale banner cleared. |

### X-KIT-05 — Scheduled auto-promote

| | |
|---|---|
| **Steps** | 1. Create scheduled order with `scheduled_for` ≤ now. 2. Reload OM / wait for promote. |
| **Expected** | Order enters active kitchen queue. |
| **Linked** | C-OM-14, A-ONLINE-03 |

### X-KIT-06 — Pause during customer checkout

| | |
|---|---|
| **Steps** | 1. Customer on checkout step 5. 2. Staff pause kitchen from OM. 3. Customer submits. |
| **Expected** | Graceful block or refresh showing closed; no orphan partial sale. |

---

## Detailed case specs — Cart & menu integrity

### X-CART-01 — Required modifier guard

| | |
|---|---|
| **Surface** | `/order` or `/kiosk` product with required modifier group |
| **Steps** | 1. Open product → attempt add without selecting required modifier. |
| **Expected** | UI blocks; `selectRequired` message; no cart line. |
| **Backend** | Client validation only |

### X-CART-02 — Combo min selections

| | |
|---|---|
| **Steps** | 1. Add combo to cart without meeting group minimum. |
| **Expected** | Cannot proceed to checkout; inline error. |

### X-CART-03 — Combo max exceeded

| | |
|---|---|
| **Steps** | 1. Select more items than group `max_select` allows. |
| **Expected** | UI prevents excess selection. |

### X-CART-04 — 50+ line items

| | |
|---|---|
| **Steps** | 1. Add 50+ distinct lines (script or repeat). 2. Open cart + checkout. |
| **Expected** | Totals correct; no perf crash; checkout viable or graceful limit. |

### X-CART-05 — Reorder deleted product

| | |
|---|---|
| **Preconditions** | Order history with product X; staff deletes product X. |
| **Steps** | 1. **Reorder** from history. |
| **Expected** | Graceful skip/error; no 500. |
| **Linked** | G-ORD-01, D-MENU-04 |

### X-CART-06 — Reorder hidden online product

| | |
|---|---|
| **Preconditions** | Order had product; staff sets `online_visible=false`. |
| **Steps** | 1. **Reorder**. |
| **Expected** | Item skipped or warning shown. |

### X-CART-07 — Kiosk-only on online surface

| | |
|---|---|
| **Steps** | 1. Set product `kiosk_visible=true`, `online_visible=false`. 2. Browse `/order`. |
| **Expected** | Product hidden or not addable online. |

### X-CART-08 — Modify cart after kitchen closed

| | |
|---|---|
| **Steps** | 1. Pause kitchen → customer sees closed error. 2. Navigate back → change cart → retry checkout. |
| **Expected** | Consistent closed state until resume. |

### X-CART-09 — Empty cart checkout blocked

| | |
|---|---|
| **Steps** | 1. Clear cart → navigate to checkout URL directly. |
| **Expected** | Redirect or disabled Place Order; no sale. |

### X-CART-10 — Browser back from confirmation

| | |
|---|---|
| **Steps** | 1. Complete order → confirmation page. 2. Browser **Back**. |
| **Expected** | Cart cleared or empty; no duplicate order on re-submit. |
| **Linked** | G-CART-01 |

---

## Detailed case specs — Money & ledger

### X-MNY-01 — Compound total math

| | |
|---|---|
| **Surface** | `/order` delivery COD |
| **Preconditions** | Valid promo + tip + zone with fee. |
| **Steps** | 1. Apply promo 10% tip zone fee → place order. |
| **Expected** | `total_price` = subtotal + delivery + tip − promo. |
| **DB verify** | `SELECT subtotal, delivery_fee, tip_amount, promo_discount, total_price FROM sales WHERE id = '<id>';` |
| **Linked** | A-ONLINE-04 |

### X-MNY-02 — Payout odd decimal commission

| | |
|---|---|
| **Surface** | `?screen=payouts` |
| **Steps** | 1. Create manual sales totaling ₼33.33 on Wolt channel. 2. Add payout → check commission preview. |
| **Expected** | Commission = gross − payout; no floating-point display glitches. |
| **Linked** | E-PAY-01 |

### X-MNY-03 — Cash drawer after movement delete

| | |
|---|---|
| **Surface** | `?screen=liabilities` → Cash drawer tab |
| **Steps** | 1. Note cross-check balance. 2. Add then delete E2E cash movement. |
| **Expected** | Balance returns to prior value. |
| **Linked** | E-CASH-04, E-CASH-05 |

### X-MNY-04 — Supplier overpay

| | |
|---|---|
| **Surface** | `?screen=suppliers` |
| **Steps** | 1. Supplier owes ₼10. 2. **Clear debt** ₼50. |
| **Expected** | Block or cap at ₼10; no unexplained negative balance. |
| **Linked** | D-SUPP-05 |

### X-MNY-05 — Delete category with expenses

| | |
|---|---|
| **Surface** | `?screen=expenses` → Categories |
| **Steps** | 1. Create category + linked operational expense. 2. Attempt delete category. |
| **Expected** | Block with clear error OR cascade policy documented. |
| **Linked** | E-CAT-02 |

### X-MNY-06 — Soft-deleted channel in today's sales

| | |
|---|---|
| **Steps** | 1. Create sale on custom channel today. 2. Soft-delete channel (F-SET-05). 3. View Home/Reports filters. |
| **Expected** | Historical sales still attributed; channel filter handles deleted gracefully. |

### X-MNY-07 — Manual sale edit affects Home KPI

| | |
|---|---|
| **Steps** | 1. Note Home revenue for Today. 2. Edit manual sale amount (E-SALE-02). 3. Refresh Home. |
| **Expected** | KPI delta matches edit. |
| **Linked** | E-SALE-02, E-HOME-01 |

### X-MNY-08 — Double confirm payment

| | |
|---|---|
| **Steps** | 1. Confirm payment on cash order. 2. Refresh → confirm again. |
| **Expected** | Second action disabled/no-op; `paid_at` unchanged. |
| **Linked** | X-RACE-01, C-OM-07 |

### X-MNY-09 — COGS delete restores stock

| | |
|---|---|
| **Steps** | 1. Record product qty. 2. Add COGS purchase (+qty). 3. Delete purchase. |
| **Expected** | `products.quantity` restored. |
| **Linked** | D-PROD-06, E-COGS-03 |

---

## Detailed case specs — Payment edge

### X-PAY-01 — Abandoned card checkout

| | |
|---|---|
| **Steps** | 1. A-ONLINE-05 to redirect URL. 2. Close tab without return. |
| **Expected** | Sale `payment_status=pending`; recoverable via recheck/webhook. |
| **DB verify** | `SELECT payment_status FROM sales WHERE id = '<sale_id>';` |
| **Linked** | A-ONLINE-05 |

### X-PAY-02 — Webhook idempotency

| | |
|---|---|
| **Steps** | 1. POST identical signed payload twice to I-WH-02. |
| **Expected** | Second POST no double-credit. |
| **Linked** | I-WH-01, I-WH-02 |

### X-PAY-03 — Webhook before return URL

| | |
|---|---|
| **Steps** | 1. Fire webhook success. 2. Then hit united-payment-return GET. |
| **Expected** | Final state paid once; no race corruption. |
| **Linked** | I-WH-02, I-WH-03 |

### X-PAY-04 — Recheck on paid row

| | |
|---|---|
| **Surface** | `?screen=payments` |
| **Steps** | 1. Open already-paid payment → **Re-check**. |
| **Expected** | No-op or stable status; no error toast. |
| **Linked** | E-PAYM-01 |

### X-PAY-05 — Recheck on failed/expired

| | |
|---|---|
| **Steps** | 1. Recheck failed/expired session row. |
| **Expected** | Status updated or clear failure message; no 500. |

---

## Detailed case specs — Auth & security

### X-SEC-01 — OTP resend cooldown

| | |
|---|---|
| **Risk** | High |
| **Steps** | 1. Send SMS OTP. 2. Immediately tap resend (<45s). |
| **Expected** | Cooldown message; RPC rate limit respected. |
| **Backend** | RPC **`rpc_request_phone_otp`** |
| **Linked** | G-AUTH-06 |

### X-SEC-02 — Expired staff JWT mid-save

| | |
|---|---|
| **Steps** | 1. Open expense form. 2. Expire/clear staff session. 3. Submit save. |
| **Expected** | Auth error; no partial write. |
| **Linked** | E-OPEX-01 |

### X-SEC-03 — Kiosk anon sales insert (known FAIL)

| | |
|---|---|
| **Surface** | `/kiosk` checkout |
| **Steps** | 1. Confirm order with network tab open. |
| **Expected (after fix):** Sale with `source=kiosk`. |
| **Actual (2026-06-26):** 403 on POST `/rest/v1/sales`. |
| **Linked** | X-BUG-01, A-KIOSK-08 |

### X-SEC-04 — Customer RLS isolation

| | |
|---|---|
| **Risk** | PREREQ — two customer accounts |
| **Steps** | 1. Customer A JWT → query Customer B `customer_addresses`. |
| **Expected** | RLS blocks; zero rows or 403. |

### X-SEC-05 — XSS in order notes

| | |
|---|---|
| **Steps** | 1. POS order notes: `<script>alert(1)</script>`. 2. View in OM/KDS/Order Support. |
| **Expected** | Escaped text; no script execution. |

### X-SEC-06 — Emoji + long name on POS

| | |
|---|---|
| **Steps** | 1. Customer name: 500 chars + emoji. 2. Create order. |
| **Expected** | Truncated or stored safely; displays in KDS/OM without layout break. |

### X-SEC-07 — Non-staff JWT on admin-api

| | |
|---|---|
| **Steps** | 1. Call **`admin-api`** with customer or anon JWT. |
| **Expected** | 401/403; no mutation. |

### X-SEC-08 — Non-admin on Users screen (BLOCKED)

| | |
|---|---|
| **Surface** | `?screen=users` as manager/staff |
| **Steps** | 1. Deep-link or click Users nav. |
| **Expected** | Redirect to `home`; sidebar hides Users for non-admin. |
| **Linked** | F-USR-01 |

---

## Detailed case specs — Realtime & stale UI

### X-RT-01 — KDS bump while OM drawer open

| | |
|---|---|
| **Steps** | 1. OM drawer open on order. 2. KDS mark **completed**. 3. Return to OM drawer. |
| **Expected** | Drawer shows completed; no stale Accept button. |
| **Linked** | B-KDS-04, C-OM-06 |

### X-RT-02 — Tracking during transitions

| | |
|---|---|
| **Steps** | 1. Keep `/track?token=…` open. 2. Staff moves order preparing→ready→dispatched. |
| **Expected** | Timeline updates live. |
| **Linked** | A-TRACK-04 |

### X-RT-03 — Payments list on webhook

| | |
|---|---|
| **Surface** | `?screen=payments` |
| **Steps** | 1. Leave payments list open. 2. Fire I-WH-02 success. |
| **Expected** | Row status updates without manual refresh. |

### X-RT-04 — Stale drag after remote move

| | |
|---|---|
| **Steps** | 1. User A drags card. 2. User B already moved same order. |
| **Expected** | Reconcile to server state; no corrupt status. |
| **Linked** | H-KOB-01, X-RACE-02 |

---

## Detailed case specs — Time & boundary

### X-TIME-01 — Today filter at Baku midnight

| | |
|---|---|
| **Surface** | `?screen=home` |
| **Steps** | 1. Run immediately before/after Asia/Baku midnight with Today filter. |
| **Expected** | KPI boundary matches calendar date in Baku TZ. |

### X-TIME-02 — Scheduled order in past

| | |
|---|---|
| **Steps** | 1. Insert or create order with `scheduled_for` in past. 2. Observe OM behavior. |
| **Expected** | Auto-promote or reject — document actual rule. |
| **Linked** | C-OM-14 |

### X-TIME-03 — M999 display number rollover

| | |
|---|---|
| **Preconditions** | Read-only check: allocator near 999. |
| **Steps** | 1. Create order when M999 exists. |
| **Expected** | Next is M001 (or documented wrap). |
| **DB verify** | `SELECT display_number FROM sales ORDER BY created_at DESC LIMIT 2;` |

### X-TIME-04 — Kiosk 60s inactivity mid-checkout

| | |
|---|---|
| **Steps** | 1. Add items → checkout → wait 61s. |
| **Expected** | Idle reset; cart cleared; no sale. |
| **Linked** | A-KIOSK-10 |

### X-TIME-05 — Zone polygon boundary pin

| | |
|---|---|
| **Steps** | 1. Place delivery pin exactly on zone polygon edge. |
| **Expected** | Consistent in/out zone decision; fee applied or rejected clearly. |
| **Linked** | F-DEL-01, A-ONLINE-02 |

### X-TIME-06 — Min order not met

| | |
|---|---|
| **Steps** | 1. Cart subtotal below zone `min_order_amount`. 2. Attempt delivery checkout. |
| **Expected** | Inline min-order error; no sale. |

---

## Detailed case specs — i18n & display

### X-I18N-01 — AZ labels on KDS

| | |
|---|---|
| **Steps** | 1. F-SET-01 language AZ (staff) or customer AZ order. 2. View order on KDS. |
| **Expected** | AZ product/status labels; no raw keys. |

### X-I18N-02 — RU OM buttons

| | |
|---|---|
| **Steps** | 1. Staff language RU → open OM. |
| **Expected** | All action buttons localized. |

### X-I18N-03 — Language switch mid-checkout

| | |
|---|---|
| **Steps** | 1. Start checkout EN → switch AZ mid-flow. |
| **Expected** | Labels update; cart/checkout state preserved. |

### X-I18N-04 — No raw translation keys

| | |
|---|---|
| **Steps** | 1. Complete order flow in each language. 2. Inspect confirmation UI/email. |
| **Expected** | No `t.` key strings visible. |

---

## Detailed case specs — Known defects

### X-BUG-01 — Kiosk checkout 403

| | |
|---|---|
| **Surface** | `/kiosk` → **Confirm Order** |
| **Actual (2026-06-26):** POST `/rest/v1/sales` returns **403**; display number allocated but sale not created. |
| **Root cause:** Anon kiosk client blocked by RLS on direct `sales` insert. |
| **Linked** | A-KIOSK-08, X-SEC-03 |

### X-BUG-02 — POS mislabeled as KIOSK

| | |
|---|---|
| **Steps** | 1. A-POS-01 → open Kiosk Orders + OM. |
| **Expected:** Source POS. **Actual (reported):** Shows KIOSK. |
| **Inspect:** `pos-order-create` `source` field, board filters. |
| **Linked** | H-KOB-01, H-SUP-* |

### X-BUG-03 — Order Support missing POS filter

| | |
|---|---|
| **Surface** | `?screen=order-support` |
| **Steps** | 1. Open source filter dropdown. |
| **Expected:** POS option; POS orders visible. **Actual:** Type `OrderSource` omits POS (`AdminOrderSupportScreen.tsx`). |

### X-BUG-04 — Tracking RPC migration gap

| | |
|---|---|
| **Steps** | `SELECT proname FROM pg_proc WHERE proname = 'get_sale_tracking_public';` |
| **Expected:** 1 row. **Repo:** no local migration — verify deployed DB before A-TRACK-*. |
| **Linked** | A-TRACK-01..04 |

### X-BUG-05 — Products screen category_id (CONFIRMED)

| | |
|---|---|
| **Surface** | `?screen=products` |
| **Steps** | Add Product → submit. |
| **Actual:** 400 DB_ERROR — payload sends `category_id`; column is `master_category_id`. |
| **File:** `src/screens/ProductsScreen.tsx` ~line 194 |
| **Linked** | D-PROD-01/02/09 |

### X-BUG-06 — completed_at column missing (NEW 2026-06-26)

| | |
|---|---|
| **Surface** | `/order-manager` → **Picked up** / **Delivered** |
| **Actual:** Error: Could not find `completed_at` column of `sales` in schema cache. |
| **Schema:** `sales` has `ready_at`, `dispatched_at` — no `completed_at`. |
| **Linked** | C-OM-11/13, H-SUP-07/08 |

### X-BUG-07 — Products category dropdown 404 (NEW 2026-06-26)

| | |
|---|---|
| **Surface** | `?screen=products` → Add Product |
| **Actual:** GET `/rest/v1/categories?type=eq.purchase` → **404**; dropdown empty. |
| **Fix direction:** Query `master_categories` like other screens. |
| **Linked** | D-PROD-01, X-BUG-05 |

---

## Cross-reference to master catalog

| Group X ID | Related master ID |
|------------|-------------------|
| X-SEC-03, X-BUG-01 | A-KIOSK-08 |
| X-BUG-02, X-BUG-03 | A-POS-01, H-KOB-*, H-SUP-* |
| X-BUG-05, X-BUG-07 | D-PROD-01..09 |
| X-BUG-06 | C-OM-11/13, H-SUP-07/08 |
| X-KIT-* | C-OM-01–05, F-DEL-04 |
| X-PAY-* | A-ONLINE-05, I-WH-* |
| X-MNY-08 | H-KOB-02, E-CASH-06 |
| X-TIME-04 | A-KIOSK-10 |
| X-I18N-* | F-SET-01, G-AUTH-* |
| All missing happy-path detail | [functional-e2e-missing-catalog-detailed.md](./functional-e2e-missing-catalog-detailed.md) |

---

## Suggested execution order

1. **Known bugs first** — X-BUG-01–07 (document baseline)
2. **Security quick wins** — X-SEC-05, X-SEC-06, X-SEC-07
3. **Double-submit trio** — X-RACE-04, 05, 06
4. **Kitchen state** — X-KIT-01–04
5. **Money edge** — X-MNY-04, 08
6. **Concurrency** — X-RACE-01, 02 (needs two sessions)
7. **Payment lab** — X-PAY-*, Group I together
8. **i18n** — X-I18N-* (needs auth)

Update master catalog **Run status** when a dynamic case confirms or closes a defect.
