# Functional E2E — Missing Catalog (Detailed Test Cases)

**Version:** 1.0  
**Created:** 2026-06-26  
**Purpose:** Full-depth runnable specs for every master-catalog case **not yet executed** in Phase 1 / Chrome re-run.  
**Parent:** [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md) · **Adversarial:** [functional-e2e-dynamic-cases.md](./functional-e2e-dynamic-cases.md) · **Ledger:** [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md)

---

## Scope

This doc covers **118 missing cases** from Groups A (remaining), C, D, E, F, G, H, I. Cases already PASS/FAIL in the master matrix are omitted here (reference master catalog for those). Group X (55 adversarial cases) is expanded in the dynamic-cases doc.

### Build & URLs

```bash
npm run deploy:local              # staff → http://127.0.0.1:4175/
npm run deploy:local:storefront   # customer → http://127.0.0.1:4176/order
```

Confirm SHA: `http://127.0.0.1:4175/build-meta.json` vs `git rev-parse HEAD`.

### Test data prefix

All created labels: `E2E-YYYYMMDD-<ID>-<slug>` (e.g. `E2E-20260626-D-MENU-06-burger`).

### Per-case fields

| Field | Description |
|-------|-------------|
| **Surface / URL** | Exact route |
| **Risk** | Low / Med / High / Boundary / PREREQ / ReadOnly |
| **Preconditions** | Auth, fixtures, blocking prereqs |
| **Steps** | Exact UI control labels (`t.*` key or EN string) |
| **Expected** | User-visible + backend outcome |
| **Backend** | Edge fn or direct table write |
| **DB verify** | Read-only SQL (real column names) |
| **Evidence** | Screenshot, network HAR, SQL output |
| **Linked** | Group X / bug IDs |

### SQL conventions

- Always **read-only** verification unless owner approves cleanup.
- Use `LIKE 'E2E-%'` filters.
- On column errors, introspect: `SELECT column_name FROM information_schema.columns WHERE table_name = '<table>' ORDER BY ordinal_position;`
- Key tables: `sales` (`order_status`, `payment_status`, `source`, `display_number`, `paid_at`, `ready_at` — **no** `completed_at` in schema), `products` (`master_category_id`, not `category_id`), `master_categories`, `online_settings`, `delivery_zones`, `customer_profiles`, `customer_addresses`, `customer_favorites`, `online_payments`, `cash_movements`, `platform_payouts`, `liabilities`, `supplier_debts`, `supplier_account_payments`.

### Known defects (pre-flag)

| Bug | Impact on cases |
|-----|-----------------|
| **X-BUG-01** | A-KIOSK-08 blocked; kiosk checkout 403 |
| **X-BUG-04** | A-TRACK-* — verify `get_sale_tracking_public` RPC exists first |
| **X-BUG-05/07** | D-PROD-01/02/07/09 — Products screen broken |
| **X-BUG-06** | C-OM-11, C-OM-13, H-SUP-07/08 — `completed_at` column missing |
| **X-BUG-02/03** | H-SUP-*, H-KOB-* — POS source mislabeled / filter missing |
| **F-DEL-10 contract** | Dispatch tab sends `{saleId}` only; fn requires `trackingUrl` |

---

## Group A — Order creation (remaining)

### A-POS-04 — POS delivery happy path

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4175/pos` |
| **Risk** | Low · **PREREQ:** Google Maps API key in env (`VITE_GOOGLE_MAPS_API_KEY`) |
| **Preconditions** | Staff logged in. At least one menu product with `online_visible=true`. |
| **Steps** | 1. **New Order** → **Delivery**. 2. Search address (type slowly for Places autocomplete) → select suggestion OR click map pin. 3. Add item → **Cash** → **Create Order**. |
| **Expected** | Success screen `#M###`; delivery address/lat/lng populated; `source` reflects POS delivery. |
| **Backend** | Edge **`pos-order-create`** → `sales`, `sale_items`, `sale_item_modifiers` |
| **DB verify** | `SELECT id, display_number, source, payment_method, delivery_address, delivery_lat, delivery_lng, total_price FROM sales WHERE display_number = '<M###>' ORDER BY created_at DESC LIMIT 1;` |
| **Evidence** | Screenshot success screen; network POST `pos-order-create` 200 |
| **Linked** | X-BUG-02 (source label in OM/Kiosk Orders) |

### A-KIOSK-10 — Kiosk 60s inactivity reset

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4175/kiosk` (secret gate) |
| **Risk** | Low |
| **Preconditions** | Kiosk secret configured. Add items to cart (do **not** confirm order). |
| **Steps** | 1. Browse → add product to cart. 2. Navigate to checkout screen. 3. Wait **61 seconds** without touch. |
| **Expected** | Returns to idle screen; cart cleared; **no** new `sales` row. |
| **Backend** | Client timer in `KioskApp.tsx` only |
| **DB verify** | `SELECT COUNT(*) FROM sales WHERE source = 'kiosk' AND created_at > NOW() - INTERVAL '5 minutes';` — count unchanged from before wait |
| **Evidence** | Screenshot idle screen after timeout |
| **Linked** | X-TIME-04 |

### A-ONLINE-01 — Online COD takeaway

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` |
| **Risk** | **PREREQ** — customer auth (email sign-in or guest checkout if enabled) |
| **Preconditions** | Kitchen open (`online_settings.is_open=true`). Takeaway enabled. |
| **Steps** | 1. Menu → add item → Cart. 2. Checkout → **Takeaway** → **Cash on delivery** (or COD). 3. Fill name/phone → **Place Order**. |
| **Expected** | Confirmation with `#M###` + track link; `source=online_takeaway`, `payment_status=pending` or `paid` per COD rules. |
| **Backend** | Edge **`online-order-create`** |
| **DB verify** | `SELECT id, display_number, source, order_status, payment_status, track_token, total_price FROM sales WHERE customer_phone LIKE '%<phone>%' ORDER BY created_at DESC LIMIT 1;` |
| **Evidence** | Confirmation screenshot; network POST `online-order-create` 200 |
| **Linked** | A-TRACK-01 fixture |

### A-ONLINE-02 — Online COD delivery + zone fee

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` |
| **Risk** | **PREREQ** — customer auth + address in active delivery zone |
| **Preconditions** | Active `delivery_zones` row with polygon containing test address. `delivery_enabled=true`. |
| **Steps** | 1. Checkout → **Delivery** → select saved address or pin in zone. 2. Verify delivery fee on total. 3. COD → **Place Order**. |
| **Expected** | `delivery_fee` > 0 on sale; total = subtotal + fee − promo (if any). |
| **Backend** | **`online-order-create`** + zone read |
| **DB verify** | `SELECT delivery_fee, delivery_address, total_price, source FROM sales WHERE id = '<sale_id>';` |
| **Evidence** | Checkout total breakdown screenshot |

### A-ONLINE-03 — Online scheduled order

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` |
| **Risk** | **PREREQ** — customer auth |
| **Preconditions** | Scheduled slots enabled in `online_settings`. |
| **Steps** | 1. Checkout → enable **Schedule for later** → pick future slot. 2. COD → **Place Order**. |
| **Expected** | `scheduled_for` set; order may show as scheduled in OM until due. |
| **Backend** | **`online-order-create`** |
| **DB verify** | `SELECT scheduled_for, order_status, reminder_at FROM sales WHERE id = '<sale_id>';` |
| **Evidence** | Confirmation shows scheduled time |

### A-ONLINE-04 — Online promo + tip + notes

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` |
| **Risk** | **PREREQ** — customer auth + valid promo code |
| **Preconditions** | Active promo in system. |
| **Steps** | 1. Apply promo code. 2. Add tip (e.g. 10%). 3. Enter order notes. 4. Place COD order. |
| **Expected** | Promo discount, tip, and notes persisted on sale. |
| **Backend** | **`online-order-create`** |
| **DB verify** | `SELECT promo_code, promo_discount, tip_amount, notes, total_price FROM sales WHERE id = '<sale_id>';` |
| **Evidence** | Confirmation + SQL row match |

### A-ONLINE-05 — Online card checkout (boundary)

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/order` |
| **Risk** | **Boundary** — stop before provider redirect/charge |
| **Preconditions** | Card payment enabled. Customer auth. |
| **Steps** | 1. Checkout → **Card** → **Place Order**. 2. Capture redirect URL from response; **do not** complete payment. |
| **Expected** | `nextStep` payment init; `online_payments` row `status=pending`; sale `payment_status=pending`. |
| **Backend** | **`epoint-create-payment`** or **`united-payment-create-payment`** |
| **DB verify** | `SELECT op.status, op.provider, s.payment_status, s.order_status FROM online_payments op JOIN sales s ON s.id = op.sale_id WHERE op.sale_id = '<sale_id>';` |
| **Evidence** | Network response with redirect URL; no charge |
| **Linked** | I-WH-*, X-PAY-01 fixture |

### A-TRACK-01 — Tracking happy path

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/track?token=<track_token>` |
| **Risk** | **PREREQ** — `track_token` from A-ONLINE-01 |
| **Preconditions** | **Run X-BUG-04 first:** `SELECT proname FROM pg_proc WHERE proname = 'get_sale_tracking_public';` must return 1 row. |
| **Steps** | 1. Open track URL with token from placed order. |
| **Expected** | Timeline + line items; no error page. |
| **Backend** | RPC **`get_sale_tracking_public`** |
| **DB verify** | `SELECT track_token, order_status FROM sales WHERE track_token = '<token>';` |
| **Evidence** | Tracking page screenshot |
| **Linked** | X-BUG-04 |

### A-TRACK-02 — Tracking missing token

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/track` |
| **Risk** | Low |
| **Steps** | 1. Open `/track` with no `token` query param. |
| **Expected** | Missing-token message (localized); no 500. |
| **Backend** | Client-only |
| **DB verify** | None |
| **Evidence** | Screenshot of error/empty state |

### A-TRACK-03 — Tracking cancelled order + reason

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/track?token=<token>` |
| **Risk** | **PREREQ** — cancelled order with `cancellation_reason` |
| **Preconditions** | Place order → staff reject with reason (C-OM-08) → use its `track_token`. |
| **Steps** | 1. Open tracking URL for cancelled order. |
| **Expected** | Cancelled UI + reason text visible. |
| **Backend** | RPC **`get_sale_tracking_public`** |
| **DB verify** | `SELECT order_status, cancellation_reason FROM sales WHERE track_token = '<token>';` |
| **Evidence** | Screenshot |

### A-TRACK-04 — Tracking realtime update

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4176/track?token=<token>` |
| **Risk** | **PREREQ** — open order + staff session |
| **Preconditions** | Active order from A-ONLINE-01; tracking page left open. |
| **Steps** | 1. Customer tab: tracking page open. 2. Staff tab: OM → **Mark ready** on same order. |
| **Expected** | Timeline updates without manual refresh (realtime subscription). |
| **Backend** | `sales` Realtime subscription |
| **DB verify** | `SELECT order_status, ready_at FROM sales WHERE id = '<sale_id>';` — `ready_at` set |
| **Evidence** | Before/after screenshots; X-RT-02 |
| **Linked** | X-RT-02 |

---

## Group C — Order Manager (remaining)

**Surface:** `http://127.0.0.1:4175/order-manager`  
**File:** `src/order-manager/OrderManagerApp.tsx`

### C-OM-02 — Kitchen pause 60 min

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. Click **Pause 60 min** (kitchen pause button). |
| **Expected** | Kitchen paused; `offline_until` ≈ now + 60m; customer checkout shows closed if tested. |
| **Backend** | **`admin-api`** → `online_settings` |
| **DB verify** | `SELECT is_open, offline_until FROM online_settings LIMIT 1;` |
| **Evidence** | OM pause banner; SQL |
| **Linked** | X-KIT-02 |

### C-OM-03 — Kitchen pause until next open

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. Click **Pause until next open**. |
| **Expected** | `is_open=false`; `offline_until` aligned to next opening hour from `hours_json`. |
| **Backend** | **`admin-api`** → `online_settings` |
| **DB verify** | `SELECT is_open, offline_until, hours_json FROM online_settings LIMIT 1;` |

### C-OM-04 — Kitchen pause indefinite

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. Click **Pause indefinitely** (or equivalent indefinite pause control). |
| **Expected** | Kitchen closed with no auto-resume time (or far-future `offline_until`). |
| **Backend** | **`admin-api`** → `online_settings` |
| **DB verify** | `SELECT is_open, offline_until FROM online_settings LIMIT 1;` |
| **Linked** | X-KIT-03 |

### C-OM-07 — Confirm payment (card pending)

| | |
|---|---|
| **Risk** | Low |
| **Preconditions** | Unpaid cash/card-pending order (e.g. kiosk COD or online pending). |
| **Steps** | 1. Open order drawer. 2. Click **Confirm payment**. |
| **Expected** | `payment_status=paid`, `paid_at` set; cash drawer credits if cash. |
| **Backend** | `buildMarkPaidPatch` → **`admin-api`** → `sales` |
| **DB verify** | `SELECT payment_status, paid_at, payment_method FROM sales WHERE id = '<sale_id>';` |
| **Linked** | X-MNY-08, H-KOB-02 |

### C-OM-09 — Accept scheduled order

| | |
|---|---|
| **Risk** | Low |
| **Preconditions** | Scheduled order with `scheduled_for` in future (A-ONLINE-03). |
| **Steps** | 1. Find scheduled order in OM. 2. Click **Accept** + pick prep time chip. |
| **Expected** | `order_status=preparing`; `reminder_at` or prep timestamps set. |
| **Backend** | `acceptScheduled` → `sales` update |
| **DB verify** | `SELECT order_status, prep_started_at, estimated_ready_at, scheduled_for FROM sales WHERE id = '<sale_id>';` |

### C-OM-12 — Self dispatch

| | |
|---|---|
| **Risk** | Low |
| **Preconditions** | Delivery order in **ready** state. |
| **Steps** | 1. Open order → **Self dispatch**. |
| **Expected** | `order_status=dispatched`; `dispatched_at` set. |
| **Backend** | `selfDispatch` → `sales` update |
| **DB verify** | `SELECT order_status, dispatched_at FROM sales WHERE id = '<sale_id>';` |

### C-OM-13 — Delivered (in delivery)

| | |
|---|---|
| **Risk** | Low · **Known: X-BUG-06** |
| **Preconditions** | Order in **dispatched** state. |
| **Steps** | 1. Click **Delivered**. |
| **Expected** | `order_status=completed`. |
| **Backend** | `updateSale` → may attempt `completed_at` write |
| **DB verify** | `SELECT order_status FROM sales WHERE id = '<sale_id>';` — expect completed; watch for schema cache error |
| **Linked** | **X-BUG-06** |

### C-OM-14 — Scheduled auto-promote (background)

| | |
|---|---|
| **Risk** | Low |
| **Preconditions** | Scheduled order with `scheduled_for` ≤ now (or set test row). |
| **Steps** | 1. Wait for OM poll / reload. 2. Or trigger load that runs `promoteDueScheduled`. |
| **Expected** | Due scheduled orders move to active/pending kitchen queue. |
| **Backend** | Direct `sales.update` in OM |
| **DB verify** | `SELECT order_status, scheduled_for FROM sales WHERE scheduled_for <= NOW() AND order_status = 'pending' LIMIT 5;` |
| **Linked** | X-KIT-05, X-TIME-02 |

### C-OM-17 — Menu editor — combo active toggle

| | |
|---|---|
| **Risk** | Med |
| **Surface** | OM → **Menu** tab |
| **Steps** | 1. Find combo in menu editor. 2. Toggle **Active** checkbox/pill. |
| **Expected** | Network POST **`admin-api`** with `combo_deals.is_active` flip. |
| **Backend** | `toggleCombo` → **`admin-api`** → `combo_deals` |
| **DB verify** | `SELECT name, is_active FROM combo_deals WHERE name LIKE 'E2E-%' ORDER BY updated_at DESC LIMIT 1;` |
| **Note** | C-OM-15/16 (product visibility) were INCONCLUSIVE in Chrome run — retest with network tab |

---

## Group D — Catalog management (remaining)

**Base URL:** `http://127.0.0.1:4175/spec-ops?screen=<screen>`

### D-MENU-01 — Toggle kiosk visibility (list)

| | |
|---|---|
| **Surface** | `?screen=menu-builder` |
| **Risk** | Med |
| **Steps** | 1. On product row, click **Show on Kiosk** icon (`handleToggleVisibility`). |
| **Expected** | Icon state flips; toast or immediate UI update. |
| **Backend** | **`admin-api`** update → `products.kiosk_visible` |
| **DB verify** | `SELECT name, kiosk_visible FROM products WHERE name LIKE 'E2E-%' ORDER BY updated_at DESC LIMIT 1;` |

### D-MENU-02 — Toggle online visibility (list)

| | |
|---|---|
| **Surface** | `?screen=menu-builder` |
| **Steps** | 1. Click globe **Show on web order** icon (`handleToggleOnlineVisibility`). |
| **Backend** | **`admin-api`** → `products.online_visible` |
| **DB verify** | `SELECT name, online_visible FROM products WHERE name LIKE 'E2E-%' ORDER BY updated_at DESC LIMIT 1;` |

### D-MENU-03 — Move product up/down

| | |
|---|---|
| **Steps** | 1. Click chevron up/down on product in category (`handleMoveProduct`). |
| **Expected** | Product order changes within category. |
| **Backend** | **`admin-api`** update ×2 → `products.display_order` |
| **DB verify** | `SELECT name, display_order FROM products WHERE master_category_id = '<cat_id>' ORDER BY display_order;` |

### D-MENU-04 — Delete product

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. Click **Delete** on E2E test product → confirm dialog **Delete**. |
| **Backend** | **`admin-api`** delete → `products` |
| **DB verify** | `SELECT COUNT(*) FROM products WHERE name = 'E2E-20260626-D-MENU-04';` → 0 |

### D-MENU-05 — Duplicate product

| | |
|---|---|
| **Steps** | 1. Click **Duplicate** on existing product. |
| **Expected** | New row with copy suffix; modifier links copied. |
| **Backend** | **`admin-api`** insert `products` + loop insert `product_modifier_groups` |
| **DB verify** | `SELECT p.name, COUNT(pmg.id) FROM products p LEFT JOIN product_modifier_groups pmg ON pmg.product_id = p.id WHERE p.name LIKE 'E2E-%Copy%' GROUP BY p.name;` |

### D-MENU-06 — Add product (MenuProductForm)

| | |
|---|---|
| **Steps** | 1. **Add Product** → fill **Product Name**, **Selling Price**, **Category** → **Create**. |
| **Backend** | **`admin-api`** insert → `products` (`master_category_id`, `selling_price`, `kiosk_visible`, `online_visible`, `is_halal`, `unit`, `quantity`, `min_stock_level`) |
| **DB verify** | `SELECT name, master_category_id, selling_price, kiosk_visible FROM products WHERE name LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 1;` |

### D-MENU-07 — Category create/edit/delete/reorder

| | |
|---|---|
| **Steps** | 1. **Menu Categories** → **Add Category** → name + icon + color → **Add Category**. 2. Reorder with chevrons. 3. Edit pencil → **Save**. 4. Delete → confirm. |
| **Backend** | **`admin-api`** → `master_categories` (`name`, `icon`, `color`, `type='menu'`, `display_order`) |
| **DB verify** | `SELECT name, type, display_order FROM master_categories WHERE name LIKE 'E2E-%' AND type = 'menu';` |

### D-MENU-08 — Modifier library CRUD + reorder

| | |
|---|---|
| **Steps** | 1. **Modifiers** → **Add Modifier Group** → **Group Name**, min/max, **Required** → **Save**. 2. **Add Option** → name + price → **Add Option**. 3. Reorder groups. 4. Delete option/group with confirm. |
| **Backend** | **`admin-api`** → `modifier_groups`, `modifier_options` |
| **DB verify** | `SELECT mg.name, mo.name, mo.price_adjustment FROM modifier_groups mg JOIN modifier_options mo ON mo.modifier_group_id = mg.id WHERE mg.name LIKE 'E2E-%';` |

### D-MENU-09 — Assign modifiers to product

| | |
|---|---|
| **Steps** | 1. Product row → **Modifiers** → click modifier group row to toggle assign (`handleToggle`). 2. Close modal (**Save** closes only — writes are immediate). |
| **Backend** | **Direct** `supabase.from('product_modifier_groups').insert/delete` |
| **DB verify** | `SELECT product_id, modifier_group_id FROM product_modifier_groups WHERE product_id = '<product_id>';` |

### D-COMB-01 — Create combo

| | |
|---|---|
| **Surface** | `?screen=combos` |
| **Steps** | 1. Enter **Combo name** + **Base Price** → **Create**. |
| **Backend** | **`admin-api`** insert → `combo_deals` (`name`, `base_price`, `is_active`, `sort_order`) |
| **DB verify** | `SELECT name, base_price, is_active FROM combo_deals WHERE name LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 1;` |

### D-COMB-02 — Active toggle (list)

| | |
|---|---|
| **Steps** | 1. Toggle **Active** checkbox on combo in left list. |
| **Backend** | **`admin-api`** → `combo_deals.is_active` |
| **DB verify** | `SELECT is_active FROM combo_deals WHERE name LIKE 'E2E-%' LIMIT 1;` |

### D-COMB-03 — Delete combo

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. **Delete** (trash) → confirm. |
| **Backend** | **`admin-api`** delete → `combo_deals` |
| **DB verify** | `SELECT COUNT(*) FROM combo_deals WHERE name = '<deleted_name>';` → 0 |

### D-COMB-04 — Save combo fields

| | |
|---|---|
| **Steps** | 1. Select combo → edit name, base price, image URL, display order, active → **Save**. |
| **Backend** | **`admin-api`** update → `combo_deals` |
| **DB verify** | `SELECT name, base_price, image_url, sort_order FROM combo_deals WHERE id = '<id>';` |

### D-COMB-05 — Group add/save/delete

| | |
|---|---|
| **Steps** | 1. **Add group** → name → **Add**. 2. Edit name + **Required** → **Save**. 3. Delete group → confirm. |
| **Backend** | **`admin-api`** → `combo_groups` (`combo_id`, `name`, `required`, `selection_type`, `sort_order`) |
| **DB verify** | `SELECT name, required FROM combo_groups WHERE combo_id = '<combo_id>';` |

### D-COMB-06 — Group item add/save/delete

| | |
|---|---|
| **Steps** | 1. Select menu item → **Add**. 2. Edit **Price adjustment** → **Save**. 3. Delete item. |
| **Backend** | **`admin-api`** → `combo_group_items` (`group_id`, `menu_item_id`, `price_adjustment`) |
| **DB verify** | `SELECT menu_item_id, price_adjustment FROM combo_group_items WHERE group_id = '<group_id>';` |

### D-COMB-07 — Upsell mapping

| | |
|---|---|
| **Steps** | 1. **Upsell mapping** section → toggle **Active** on product → select combo from dropdown. |
| **Backend** | **`admin-api`** → `products.combo_upsell_eligible`, `products.upsell_combo_id` |
| **DB verify** | `SELECT name, combo_upsell_eligible, upsell_combo_id FROM products WHERE name LIKE 'E2E-%';` |

### D-PROD-03 — Delete product

| | |
|---|---|
| **Surface** | `?screen=products` |
| **Risk** | Med |
| **Preconditions** | Create disposable E2E product first (via Menu Builder if Products add broken). |
| **Steps** | 1. Product card → **Delete** → confirm. |
| **Backend** | **`admin-api`** delete → `products` |
| **DB verify** | `SELECT COUNT(*) FROM products WHERE name = '<name>';` → 0 |

### D-PROD-05 — Edit purchase

| | |
|---|---|
| **Steps** | 1. Product → purchase history → **Edit purchase** → change qty/cost → **Update Purchase**. |
| **Backend** | **`admin-api`** update → `purchases`; stock reconcile → `products.quantity` |
| **DB verify** | `SELECT quantity, unit_cost, total_cost FROM purchases WHERE notes LIKE 'E2E-%' ORDER BY updated_at DESC LIMIT 1;` |

### D-PROD-06 — Delete purchase (stock reconcile)

| | |
|---|---|
| **Steps** | 1. Note product `quantity` before. 2. **Delete purchase** on E2E purchase row. |
| **Expected** | Purchase removed; product quantity decreased by purchase qty. |
| **Backend** | **`admin-api`** delete + `reconcileProductStock` |
| **DB verify** | `SELECT quantity FROM products WHERE id = '<product_id>';` compare before/after |
| **Linked** | X-MNY-09 |

### D-PROD-07 — Inline create product

| | |
|---|---|
| **Steps** | 1. Add Purchase modal → product select **+ Create New Product** → name + cost → **Create & Select**. |
| **Backend** | **`admin-api`** insert → `products` |
| **DB verify** | `SELECT name, cost_price FROM products WHERE name LIKE 'E2E-%inline%';` |
| **Linked** | X-BUG-05 (Products main form still broken) |

### D-PROD-08 — Inline create supplier

| | |
|---|---|
| **Steps** | 1. Purchase modal → **+ Create New Supplier** → **Supplier Name** → **Create & Select**. |
| **Backend** | **`admin-api`** insert → `suppliers` |
| **DB verify** | `SELECT name, is_active FROM suppliers WHERE name LIKE 'E2E-%';` |

### D-PROD-09 — Kiosk/online visibility in form

| | |
|---|---|
| **Steps** | 1. Add/Edit product form → toggle **Show on Kiosk** and **Show on web order** checkboxes → submit. |
| **Expected** | Checkboxes persist on save. |
| **Backend** | **`admin-api`** → `products.kiosk_visible`, `online_visible` |
| **DB verify** | `SELECT kiosk_visible, online_visible FROM products WHERE name LIKE 'E2E-%';` |
| **Linked** | **X-BUG-05/07** — main Products add/edit may fail; use Menu Builder path to create fixture first |

### D-SUPP-02 — Delete supplier

| | |
|---|---|
| **Surface** | `?screen=suppliers` |
| **Risk** | Med |
| **Preconditions** | E2E-only supplier with no critical dependencies. |
| **Steps** | 1. Trash icon → **Delete** confirm. |
| **Backend** | **`admin-api`** delete → `suppliers` |
| **DB verify** | `SELECT COUNT(*) FROM suppliers WHERE name LIKE 'E2E-%del%';` → 0 |

### D-SUPP-03 — Active toggle

| | |
|---|---|
| **Steps** | 1. Click **Active** / **Inactive** toggle on supplier card. |
| **Backend** | **`admin-api`** → `suppliers.is_active` |
| **DB verify** | `SELECT name, is_active FROM suppliers WHERE name LIKE 'E2E-%';` |

### D-SUPP-06 — Delete payment

| | |
|---|---|
| **Steps** | 1. Expand supplier account history → trash on payment row. |
| **Backend** | **`admin-api`** delete → `supplier_account_payments` |
| **DB verify** | `SELECT COUNT(*) FROM supplier_account_payments WHERE supplier_id = '<id>' AND notes LIKE 'E2E-%';` |

### D-SUPP-07 — Edit/delete manual debt

| | |
|---|---|
| **Steps** | 1. **Add debt** → amount + date → **Save**. 2. Edit pencil → change amount → **Save**. 3. Delete debt row. |
| **Backend** | **`admin-api`** → `supplier_debts` (`supplier_id`, `amount`, `debt_date`, `notes`) |
| **DB verify** | `SELECT amount, debt_date FROM supplier_debts WHERE notes LIKE 'E2E-%';` |

---

## Group E — Finance & analytics (remaining)

### E-SALE-02 — Edit manual sale

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4175/spec-ops?screen=sales` |
| **Risk** | Low |
| **Preconditions** | E2E manual partner sale exists (E-SALE-01). |
| **Steps** | 1. Expand date group → click edit (pencil) on row. 2. Change **Amount**, **Orders**, channel, date → check icon save. |
| **Backend** | **`admin-api`** update → `sales` (`total_price`, `quantity`, `unit_price`, `sales_channel_id`, `sale_date`, `notes`) |
| **DB verify** | `SELECT total_price, quantity, sales_channel_id FROM sales WHERE notes LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 1;` |
| **Linked** | X-MNY-07 |

### E-SALE-03 — Delete manual sale

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. Trash icon → **Delete** confirm. |
| **Backend** | **`admin-api`** delete → `sales` |
| **DB verify** | `SELECT COUNT(*) FROM sales WHERE id = '<id>';` → 0 |

### E-OPEX-02 — Edit operational expense

| | |
|---|---|
| **Surface** | `?screen=expenses` → Operational tab |
| **Steps** | 1. Edit icon on expense row → change amount/date → **Update Expense**. |
| **Backend** | **`admin-api`** update → `operational_expenses` |
| **DB verify** | `SELECT amount, expense_date, description FROM operational_expenses WHERE description LIKE 'E2E-%';` |

### E-OPEX-03 — Delete operational expense

| | |
|---|---|
| **Steps** | 1. Delete icon → confirm **Delete**. |
| **Backend** | **`admin-api`** delete → `operational_expenses` |
| **DB verify** | `SELECT COUNT(*) FROM operational_expenses WHERE description LIKE 'E2E-%del%';` → 0 |

### E-COGS-01 — Create COGS purchase

| | |
|---|---|
| **Surface** | Expenses → **COGS (Purchases)** tab → **+ New Purchase** |
| **Steps** | 1. Select expense item + supplier + qty + cost + date → **Create Purchase**. |
| **Backend** | **`admin-api`** insert → `purchases` |
| **DB verify** | `SELECT quantity, unit_cost, total_cost, payment_status, is_on_credit FROM purchases WHERE notes LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 1;` |

### E-COGS-02 — Edit COGS purchase

| | |
|---|---|
| **Steps** | 1. Edit purchase row → change qty → **Update Purchase**. |
| **Backend** | **`admin-api`** update + optional `products.quantity` reconcile |
| **DB verify** | `SELECT quantity, total_cost FROM purchases WHERE id = '<id>';` |

### E-COGS-03 — Delete COGS purchase

| | |
|---|---|
| **Steps** | 1. Delete purchase → confirm. |
| **Backend** | **`admin-api`** delete → `purchases` |
| **DB verify** | Product stock restored — `SELECT quantity FROM products WHERE id = '<product_id>';` |
| **Linked** | X-MNY-09 |

### E-COGS-04 — On-account vs paid now

| | |
|---|---|
| **Steps** | 1. Create purchase with **On account** → verify `payment_status=pending`, `is_on_credit=true`. 2. Create second with **Paid now** → `payment_status=paid`, `is_on_credit=false`. |
| **Backend** | **`admin-api`** → `purchases.is_on_credit`, `purchases.payment_status` |
| **DB verify** | `SELECT is_on_credit, payment_status FROM purchases WHERE notes LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 2;` |

### E-CAT-02 — Delete category

| | |
|---|---|
| **Surface** | Expenses → **Categories** tab |
| **Risk** | Med |
| **Preconditions** | Empty E2E-only category (no linked expenses). |
| **Steps** | 1. Delete category → confirm. |
| **Backend** | **`admin-api`** delete → `master_categories` |
| **DB verify** | `SELECT COUNT(*) FROM master_categories WHERE name LIKE 'E2E-%cat-del%';` → 0 |
| **Linked** | X-MNY-05 (delete category with active expenses) |

### E-CAT-03 — Sub-item add/save/delete

| | |
|---|---|
| **Steps** | 1. **+** on category → sub-item name → **Add**. 2. Edit → **Update**. 3. Delete sub-item. |
| **Backend** | **`admin-api`** → `expense_items` (`name`, `master_category_id`, `user_id`) |
| **DB verify** | `SELECT name, master_category_id FROM expense_items WHERE name LIKE 'E2E-%';` |

### E-PAY-02 — Update payout

| | |
|---|---|
| **Surface** | `?screen=payouts` |
| **Steps** | 1. **Edit** on payout row → change amount/date → **Update**. |
| **Backend** | **`admin-api`** update → `platform_payouts` |
| **DB verify** | `SELECT payout_amount, period_start, period_end FROM platform_payouts WHERE notes LIKE 'E2E-%';` |

### E-PAY-03 — Delete payout

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. **Delete** confirm on E2E payout. |
| **Backend** | **`admin-api`** delete → `platform_payouts` |
| **DB verify** | `SELECT COUNT(*) FROM platform_payouts WHERE notes LIKE 'E2E-%del%';` → 0 |

### E-CASH-01 — Add liability

| | |
|---|---|
| **Surface** | `?screen=liabilities` → **Loans & other** tab |
| **Steps** | 1. **Add liability** → type **Loan** → lender + amount + date → **Save**. |
| **Backend** | **`admin-api`** insert → `liabilities` (`type`, `counterparty`, `principal_amount`, `incurred_date`, `status='open'`) |
| **DB verify** | `SELECT counterparty, principal_amount, status FROM liabilities WHERE counterparty LIKE 'E2E-%';` |

### E-CASH-02 — Record liability payment

| | |
|---|---|
| **Steps** | 1. **Record payment** on liability row → amount + date → submit. |
| **Backend** | **`admin-api`** insert → `liability_payments`; update → `liabilities.status` |
| **DB verify** | `SELECT lp.amount, l.status FROM liability_payments lp JOIN liabilities l ON l.id = lp.liability_id WHERE l.counterparty LIKE 'E2E-%';` |

### E-CASH-03 — Log bank withdrawal

| | |
|---|---|
| **Surface** | **Bank withdrawals** tab |
| **Steps** | 1. Amount + method (**Cashier** or **ABB ATM**) + date → **Log withdrawal**. |
| **Backend** | **`admin-api`** insert → `bank_withdrawals` |
| **DB verify** | `SELECT amount, method, withdrawal_date FROM bank_withdrawals WHERE notes LIKE 'E2E-%';` |

### E-CASH-04 — Add cash movement

| | |
|---|---|
| **Surface** | **Cash drawer** tab |
| **Steps** | 1. Category + direction + amount + date → **Add cash movement**. |
| **Backend** | **`admin-api`** insert → `cash_movements` (`direction`, `category`, `amount`, `movement_date`, `notes`) |
| **DB verify** | `SELECT direction, category, amount FROM cash_movements WHERE notes LIKE 'E2E-%' ORDER BY created_at DESC LIMIT 1;` |

### E-CASH-05 — Delete cash movement

| | |
|---|---|
| **Steps** | 1. Trash on movement row in log. |
| **Backend** | **`admin-api`** delete → `cash_movements` |
| **DB verify** | Drawer recalc — compare cross-check panel before/after |
| **Linked** | X-MNY-03 |

### E-PAYM-01 — Recheck payment

| | |
|---|---|
| **Surface** | `?screen=payments` |
| **Risk** | **Boundary** |
| **Preconditions** | Pending `online_payments` row (from A-ONLINE-05). |
| **Steps** | 1. Filter **Pending** → click row → drawer → **Re-check status with provider** (`data-testid="payments-recheck-button"`). |
| **Backend** | Edge **`admin-payment-recheck`** → may invoke **`payment-reconcile`** or **`united-payment-status-check`** |
| **DB verify** | `SELECT status, updated_at, error_message FROM online_payments WHERE id = '<id>';` |
| **Linked** | X-PAY-04, X-PAY-05 |

### E-HOME-01 — Home date/source/compare filters

| | |
|---|---|
| **Surface** | `?screen=home` |
| **Risk** | **ReadOnly** |
| **Steps** | 1. Cycle period presets (Today, 7D, 30D, MTD, QTD, Custom). 2. Toggle **Compare previous period**. 3. Click each **Source** chip (All, Manual, Kiosk, Online delivery, etc.). 4. Toggle channel chips under Sales by Channel. |
| **Expected** | KPI cards and charts update; no console errors; no network writes. |
| **Evidence** | Screenshot per filter combination |

### E-MONY-01 — Money tab views

| | |
|---|---|
| **Surface** | `?screen=money` |
| **Risk** | **ReadOnly** |
| **Steps** | 1. Tab **Sales Income** → verify last 50 sales. 2. **COGS (Purchases)**. 3. **Operational Expenses**. |
| **Expected** | Tables load; 14-day KPI trend visible; no mutations. |

### E-RPT-01 — Reports filters + KPIs

| | |
|---|---|
| **Surface** | `?screen=reports` |
| **Risk** | **ReadOnly** |
| **Steps** | 1. Change period presets + custom range. 2. Toggle source chips. |
| **Expected** | KPI totals and channel breakdown refresh. |

### E-LOC-01 — Order Locations map

| | |
|---|---|
| **Surface** | `?screen=order-locations` |
| **Risk** | **ReadOnly** |
| **Steps** | 1. Default 30D period → change to Today/7D. 2. Source chips: All / Online delivery / POS delivery. |
| **Expected** | Map pins appear for matching delivery orders; no writes. |
| **DB verify** | Optional: `SELECT COUNT(*) FROM sales WHERE delivery_lat IS NOT NULL AND sale_date >= CURRENT_DATE - 30;` |

---

## Group F — Configuration & access (remaining)

### F-SET-02 — Theme toggle

| | |
|---|---|
| **Surface** | `?screen=settings` |
| **Risk** | Low (local only) |
| **Steps** | 1. Click **Dark mode** / **Light mode** toggle. |
| **Expected** | UI theme switches; `localStorage.theme` updated; **no DB write**. |
| **Evidence** | Screenshot + DevTools Application → localStorage |

### F-SET-04 — Toggle channel active

| | |
|---|---|
| **Steps** | 1. On custom E2E channel (not Wolt/Bolt/Kiosk/Online/POS), click **Active** / **Inactive**. |
| **Backend** | **`admin-api`** → `sales_channels.is_active` |
| **DB verify** | `SELECT name, is_active FROM sales_channels WHERE name LIKE 'E2E-%';` |
| **Note** | Protected system channels cannot toggle (policy guard) |

### F-SET-05 — Delete channel (soft)

| | |
|---|---|
| **Risk** | Med |
| **Steps** | 1. **Delete** on custom E2E channel. |
| **Expected** | Soft delete: `is_deleted=true`, `is_active=false`. |
| **Backend** | **`admin-api`** update → `sales_channels` |
| **DB verify** | `SELECT is_deleted, is_active FROM sales_channels WHERE name LIKE 'E2E-%';` |
| **Linked** | X-MNY-06 |

### F-DEL-01 — Create/save delivery zone

| | |
|---|---|
| **Surface** | `?screen=delivery&tab=zones` |
| **Risk** | Med · **PREREQ:** map polygon drawing |
| **Steps** | 1. **New zone** → draw polygon on map → name + fee + min order → **Save**. |
| **Backend** | **`admin-api`** insert → `delivery_zones` (`name`, `polygon`, `delivery_fee`, `min_order_amount`, `is_active`, `sort_order`) |
| **DB verify** | `SELECT name, delivery_fee, is_active FROM delivery_zones WHERE name LIKE 'E2E-%';` |

### F-DEL-02 — Toggle zone active

| | |
|---|---|
| **Steps** | 1. Power toggle on zone row. |
| **Backend** | **`admin-api`** → `delivery_zones.is_active` |
| **DB verify** | `SELECT is_active FROM delivery_zones WHERE name LIKE 'E2E-%';` |

### F-DEL-03 — Delete zone

| | |
|---|---|
| **Steps** | 1. Delete E2E zone → confirm. |
| **Backend** | **`admin-api`** delete → `delivery_zones` |
| **DB verify** | `SELECT COUNT(*) FROM delivery_zones WHERE name LIKE 'E2E-%del%';` → 0 |

### F-DEL-04 — Kitchen open/close

| | |
|---|---|
| **Surface** | `?screen=delivery&tab=settings` |
| **Steps** | 1. Toggle **Kitchen open** off → **Save**. 2. Toggle on → **Save**. |
| **Backend** | **`admin-api`** → `online_settings.is_open` |
| **DB verify** | `SELECT is_open, offline_until FROM online_settings LIMIT 1;` |
| **Linked** | X-KIT-* |

### F-DEL-05 — Cancel pause

| | |
|---|---|
| **Preconditions** | Kitchen paused (`is_open=false`). |
| **Steps** | 1. Click **Cancel pause**. |
| **Expected** | `is_open=true`, `offline_until=null`. |
| **Backend** | **`admin-api`** update → `online_settings` |
| **DB verify** | `SELECT is_open, offline_until FROM online_settings LIMIT 1;` |

### F-DEL-06 — Delivery/takeaway toggles

| | |
|---|---|
| **Steps** | 1. Uncheck **Delivery** and/or **Takeaway** → **Save**. 2. Re-enable → **Save**. |
| **Backend** | **`admin-api`** → `online_settings.delivery_enabled`, `takeaway_enabled` |
| **DB verify** | `SELECT delivery_enabled, takeaway_enabled FROM online_settings LIMIT 1;` |

### F-DEL-07 — Save hours/min/prep/coords

| | |
|---|---|
| **Steps** | 1. Set global min order, prep time, free threshold, kitchen lat/lng, per-day hours → **Save**. |
| **Backend** | **`admin-api`** → `online_settings` (all fields in patch) |
| **DB verify** | `SELECT min_order_amount, default_prep_time_minutes, kitchen_lat, kitchen_lng, hours_json FROM online_settings LIMIT 1;` |

### F-DEL-08 — Wolt dispatch create (stub)

| | |
|---|---|
| **Surface** | `?screen=delivery&tab=dispatch` |
| **Risk** | Low (stub) |
| **Preconditions** | Online delivery order in last 24h. |
| **Steps** | 1. Click **Dispatch** on order row. |
| **Backend** | Edge **`wolt-drive-create`** `{ saleId }` |
| **DB verify** | `SELECT status, wolt_delivery_id FROM delivery_orders WHERE sale_id = '<sale_id>';` |

### F-DEL-09 — Wolt cancel (stub)

| | |
|---|---|
| **Steps** | 1. **Cancel Wolt** on dispatched order. |
| **Backend** | **`wolt-drive-cancel`** |
| **DB verify** | `SELECT status FROM delivery_orders WHERE sale_id = '<sale_id>';` — expect `cancelled` |

### F-DEL-10 — Manual dispatch + tracking URL

| | |
|---|---|
| **Steps** | 1. **Mark manual** on delivery order. |
| **Expected** | Order dispatched with tracking URL stored. |
| **Backend** | **`wolt-drive-manual-dispatch`** — **contract mismatch:** UI sends `{saleId}` only; fn requires `{saleId, trackingUrl}` |
| **DB verify** | `SELECT order_status FROM sales WHERE id = '<sale_id>';` |
| **Linked** | Likely **400** until UI fixed; H-KOB-03 uses tracking URL field |

### F-USR-01 — Create user

| | |
|---|---|
| **Surface** | `?screen=users` |
| **Risk** | Med · **PREREQ:** admin JWT (`app_metadata.role=admin`) |
| **Preconditions** | Non-admin deep-link redirects to home (X-SEC-08). |
| **Steps** | 1. **Add New User** → email + password + role → submit. |
| **Backend** | Edge **`user-management`** POST `/create` |
| **DB verify** | `SELECT username, role FROM users WHERE username LIKE 'E2E-%';` |

### F-USR-02 — Delete user

| | |
|---|---|
| **Risk** | **High** — owner approval; do not delete production accounts |
| **Steps** | 1. Trash on E2E test user only → confirm. |
| **Backend** | **`user-management`** DELETE `/delete/{userId}` |
| **DB verify** | `SELECT COUNT(*) FROM users WHERE username = '<email>';` → 0 |

### F-USR-03 — Change role

| | |
|---|---|
| **Steps** | 1. Role `<select>` on E2E user → change Staff/Manager/Admin. |
| **Backend** | **`user-management`** PUT `/update-role` |
| **DB verify** | `SELECT role FROM users WHERE id = '<user_id>';` |

### F-USR-04 — Reset password

| | |
|---|---|
| **Steps** | 1. Key icon **Reset password** → enter new password (≥8 chars). |
| **Backend** | **`user-management`** PUT `/reset-password` → Auth `updateUserById` |
| **DB verify** | Sign in as user with new password (functional verify) |

---

## Group G — Customer account (`/order`)

**Surface:** `http://127.0.0.1:4176/order` · **File:** `src/order/OrderApp.tsx`, `OrderAccountPanel.tsx`

### G-AUTH-01 — Email sign in

| | |
|---|---|
| **Risk** | **PREREQ** — test customer credentials |
| **Steps** | 1. Account tab → email + password → **Sign in**. |
| **Expected** | Session established; account panel shows profile. |
| **Backend** | `supabase.auth.signInWithPassword` |
| **Evidence** | Logged-in UI; no error toast |

### G-AUTH-02 — Email sign up

| | |
|---|---|
| **Steps** | 1. **Sign up** → new email `E2E-YYYYMMDD-auth@test.local` + password → submit. |
| **Backend** | `supabase.auth.signUp` |
| **DB verify** | `SELECT id FROM customer_profiles WHERE id = '<auth_uid>';` may be empty until profile save |

### G-AUTH-03 — Forgot password

| | |
|---|---|
| **Steps** | 1. **Forgot password** → enter email → submit. |
| **Expected** | Success message; reset email sent (check inbox or Supabase Auth logs). |
| **Backend** | `supabase.auth.resetPasswordForEmail` |

### G-AUTH-04 — Reset password (recovery link)

| | |
|---|---|
| **Preconditions** | Recovery link with `type=recovery` in URL/hash. |
| **Steps** | 1. Open recovery URL → enter new password → submit. |
| **Backend** | `supabase.auth.updateUser({ password })` |

### G-AUTH-05 — Google OAuth sign in

| | |
|---|---|
| **Risk** | **PREREQ** — Google OAuth configured + manual browser step |
| **Steps** | 1. **Continue with Google** → complete OAuth in popup. |
| **Backend** | `supabase.auth.signInWithOAuth({ provider: 'google' })` |

### G-AUTH-06 — Send SMS OTP

| | |
|---|---|
| **Risk** | **High** — real SMS |
| **Steps** | 1. Enter phone → **Send SMS code**. |
| **Backend** | RPC **`rpc_request_phone_otp`** then `signInWithOtp` |
| **Linked** | X-SEC-01 (45s cooldown) |

### G-AUTH-07 — Verify SMS OTP

| | |
|---|---|
| **Risk** | **High** |
| **Steps** | 1. Enter OTP → **Verify**. |
| **Backend** | `verifyOtp` + profile `phone_verified_at` |
| **DB verify** | `SELECT phone, phone_verified_at FROM customer_profiles WHERE id = '<uid>';` |

### G-AUTH-08 — Sign out

| | |
|---|---|
| **Steps** | 1. **Sign out**. |
| **Expected** | Session cleared; guest UI. |
| **Backend** | `supabase.auth.signOut` |

### G-PROF-01 — Save customer profile

| | |
|---|---|
| **Steps** | 1. Edit name/phone → **Save profile**. |
| **Backend** | Direct upsert → **`customer_profiles`** (`full_name`, `first_name`, `last_name`, `phone`, terms fields) |
| **DB verify** | `SELECT full_name, phone FROM customer_profiles WHERE id = '<uid>';` |

### G-PROF-02 — Google profile completion modal

| | |
|---|---|
| **Preconditions** | First Google sign-in without complete profile. |
| **Steps** | 1. Complete modal fields → accept terms → submit. |
| **Backend** | **`customer_profiles`** + terms version columns |

### G-ADDR-01 — Add address

| | |
|---|---|
| **Steps** | 1. **Add address** → label, line1, map pin, building details → save. |
| **Backend** | Insert → **`customer_addresses`** (all address columns + `lat`, `lng`, `is_default`) |
| **DB verify** | `SELECT label, line1, lat, lng, is_default FROM customer_addresses WHERE user_id = '<uid>' AND label LIKE 'E2E-%';` |

### G-ADDR-02 — Edit address

| | |
|---|---|
| **Steps** | 1. Edit existing E2E address → change label/instructions → save. |
| **Backend** | Update → **`customer_addresses`** |
| **DB verify** | `SELECT label, courier_instructions FROM customer_addresses WHERE id = '<id>';` |

### G-ADDR-03 — Set default address

| | |
|---|---|
| **Steps** | 1. **Set as default** on non-default address. |
| **Expected** | Only one row with `is_default=true` for user. |
| **Backend** | Updates all others `is_default=false`, target `true` |
| **DB verify** | `SELECT COUNT(*) FROM customer_addresses WHERE user_id = '<uid>' AND is_default = true;` → 1 |

### G-ADDR-04 — Delete address

| | |
|---|---|
| **Steps** | 1. **Delete** on E2E address → confirm. |
| **Backend** | Delete → **`customer_addresses`**; may promote next as default |
| **DB verify** | `SELECT COUNT(*) FROM customer_addresses WHERE label LIKE 'E2E-%';` → 0 |

### G-FAV-01 — Toggle favorite product

| | |
|---|---|
| **Steps** | 1. Heart icon on menu product (signed in). |
| **Backend** | Insert/delete → **`customer_favorites`** (`user_id`, `product_id`) |
| **DB verify** | `SELECT product_id FROM customer_favorites WHERE user_id = '<uid>';` |

### G-ORD-01 — Reorder from history

| | |
|---|---|
| **Preconditions** | Prior order in history (A-ONLINE-01). |
| **Steps** | 1. Account → Orders → **Reorder** on past order. |
| **Expected** | Cart rebuilt from `sale_items`; products still on menu included. |
| **Backend** | Client-only cart state + localStorage |
| **Linked** | X-CART-05, X-CART-06 |

### G-CART-01 — Client cart add/remove/qty/notes

| | |
|---|---|
| **Risk** | Low |
| **Steps** | 1. Add items, change qty, remove line, add notes. 2. Refresh page. |
| **Expected** | Cart persists via `localStorage` key `mings-order-cart-v2`. |
| **Evidence** | DevTools → Application → localStorage |

### G-COOK-01 — Cookie consent accept

| | |
|---|---|
| **Steps** | 1. Clear `mings-order-cookie-consent-v1` → reload → **Accept** on banner. |
| **Expected** | Banner hidden; key set to `'accepted'`. |
| **Backend** | localStorage only |

---

## Group H — Order Support + Kiosk Orders (remaining)

**Known:** Order Support `OrderSource` type omits POS (`AdminOrderSupportScreen.tsx` line 39) — **X-BUG-03**. POS orders may show as KIOSK — **X-BUG-02**.

### H-SUP-01 — Order Support confirm payment

| | |
|---|---|
| **Surface** | `http://127.0.0.1:4175/spec-ops?screen=order-support` |
| **Risk** | Low |
| **Preconditions** | Unpaid order visible in list (COD/pending). |
| **Steps** | 1. Click order row → drawer → **Confirm payment**. |
| **Backend** | `buildMarkPaidPatch` → **`admin-api`** → `sales` |
| **DB verify** | `SELECT payment_status, paid_at FROM sales WHERE id = '<sale_id>';` |

### H-SUP-02 — Accept + prep time

| | |
|---|---|
| **Steps** | 1. Pending order → **Accept** → select prep chip (5–30 min). |
| **Backend** | **`admin-api`** → `sales.order_status`, `prep_started_at`, `estimated_ready_at` |
| **DB verify** | `SELECT order_status, estimated_ready_at FROM sales WHERE id = '<sale_id>';` |

### H-SUP-03 — Quick prepare 15m

| | |
|---|---|
| **Steps** | 1. Use **Quick prepare 15m** shortcut if shown on pending order. |
| **Expected** | Same as accept with 15-minute prep. |
| **DB verify** | `SELECT estimated_ready_at, prep_started_at FROM sales WHERE id = '<sale_id>';` |

### H-SUP-04 — Reject + reason

| | |
|---|---|
| **Steps** | 1. **Reject** → pick each reason option (run once per reason or spot-check). |
| **Backend** | **`admin-api`** → `sales.order_status='cancelled'`, `cancellation_reason` |
| **DB verify** | `SELECT order_status, cancellation_reason FROM sales WHERE id = '<sale_id>';` |

### H-SUP-05 — Mark ready

| | |
|---|---|
| **Preconditions** | Order in **preparing**. |
| **Steps** | 1. **Mark ready**. |
| **Backend** | **`admin-api`** → `sales.order_status='ready'`, `ready_at` |
| **DB verify** | `SELECT order_status, ready_at FROM sales WHERE id = '<sale_id>';` |

### H-SUP-06 — Self dispatch

| | |
|---|---|
| **Preconditions** | Delivery order **ready**. |
| **Steps** | 1. **Self dispatch**. |
| **Backend** | **`admin-api`** → `sales.order_status='dispatched'`, `dispatched_at` |
| **DB verify** | `SELECT order_status, dispatched_at FROM sales WHERE id = '<sale_id>';` |

### H-SUP-07 — Picked up

| | |
|---|---|
| **Preconditions** | Takeaway/kiosk order **ready**. |
| **Steps** | 1. **Picked up**. |
| **Expected** | `order_status=completed`. |
| **Linked** | **X-BUG-06** (`completed_at` schema error possible) |
| **DB verify** | `SELECT order_status FROM sales WHERE id = '<sale_id>';` |

### H-SUP-08 — Delivered

| | |
|---|---|
| **Preconditions** | Order **dispatched**. |
| **Steps** | 1. **Delivered**. |
| **Linked** | **X-BUG-06** |
| **DB verify** | `SELECT order_status FROM sales WHERE id = '<sale_id>';` |

### H-KOB-01 — Kiosk Orders drag status change

| | |
|---|---|
| **Surface** | `?screen=kiosk-orders` |
| **File** | `KioskOrdersBoard.tsx` — `canMoveToStatus` guards payment before prep |
| **Steps** | 1. Drag order card from **New** → **In prep** (after payment confirmed). 2. Continue **Ready** → **Done**. |
| **Backend** | Direct/`admin-api` sale status update on drop |
| **DB verify** | `SELECT order_status FROM sales WHERE display_number = '<M###>';` |
| **Linked** | X-RACE-02, X-RT-04 |

### H-KOB-03 — Save Wolt tracking URL

| | |
|---|---|
| **Steps** | 1. Expand delivery order card → enter tracking URL → **Save** (or save tracking button). |
| **Backend** | Update → `delivery_orders.tracking_url` |
| **DB verify** | `SELECT tracking_url, manually_dispatched FROM delivery_orders WHERE sale_id = '<sale_id>';` |

### H-KOB-04 — Wolt book lock

| | |
|---|---|
| **Steps** | 1. Click **Book Wolt** (or equivalent) on eligible delivery order. |
| **Backend** | Edge **`wolt-dispatch-book-lock`** |
| **DB verify** | `SELECT wolt_booking_locked_until FROM delivery_orders WHERE sale_id = '<sale_id>';` |

---

## Group I — Payment webhooks (controlled HTTP)

**Base URL:** `https://<project-ref>.supabase.co/functions/v1/<function>`  
**Fixture:** Sale + `online_payments` row from **A-ONLINE-05** (card init, not completed).

### I-WH-01 — EPoint webhook (mock signed payload)

| | |
|---|---|
| **Risk** | **Boundary** |
| **Method** | POST |
| **Auth** | Production: body `{ data, signature }` verified with **`EPOINT_PRIVATE_KEY`**. Legacy dev: header **`X-Epoint-Signature`** HMAC-SHA256 with **`EPOINT_WEBHOOK_SECRET`**. |
| **Body** | Decoded payload: `order_id`, `status`, `transaction`, `operation_code` |
| **Steps** | 1. Craft mock success payload for pending payment. 2. POST with valid signature. |
| **Expected** | `online_payments.status=paid`; `sales.payment_status=paid`; optional `saved_cards` insert. |
| **DB verify** | `SELECT op.status, op.paid_at, s.payment_status, s.order_status FROM online_payments op JOIN sales s ON s.id = op.sale_id WHERE op.sale_id = '<sale_id>';` |
| **Linked** | X-PAY-02 |

### I-WH-02 — United Payment webhook (mock)

| | |
|---|---|
| **Method** | POST |
| **Auth** | Header **`X-Signature`**: HMAC-SHA256 URL-safe base64 with **`UNITED_PAYMENT_WEBHOOK_SECRET`** or **`UNITED_PAYMENT_HASH_KEY`** |
| **Body** | JSON or form: `clientOrderId`, `transactionId`, `status` |
| **Steps** | 1. POST mock success twice (idempotency test with X-PAY-02). |
| **DB verify** | Same as I-WH-01 for `provider='united_payment'` |

### I-WH-03 — United Payment return (GET redirect)

| | |
|---|---|
| **Method** | GET (browser redirect) |
| **Auth** | None (public); server re-confirms via United Payment API |
| **Query** | `sale`, `kind`, `transactionId`, `status`, optional base64 `up` |
| **Steps** | 1. Simulate GET to return URL with success params. |
| **Expected** | 302 to `/order?paid=1&sale=<uuid>`; payment row updated. |
| **DB verify** | `SELECT status FROM online_payments WHERE sale_id = '<sale_id>';` |

### I-WH-04 — payment-reconcile (secret bearer)

| | |
|---|---|
| **Method** | POST |
| **Auth** | **`Authorization: Bearer <PAYMENT_RECONCILE_SECRET>`** |
| **Body** | JSON: exactly one of `{ "sale_id": "..." }` OR `{ "online_payment_id": "..." }` |
| **Steps** | 1. POST for Epoint pending payment. |
| **Expected** | Status reconciled; **`payment_reconciliation_log`** row inserted. |
| **DB verify** | `SELECT action, before_snapshot, after_snapshot FROM payment_reconciliation_log WHERE sale_id = '<sale_id>' ORDER BY created_at DESC LIMIT 1;` |

### I-WH-05 — united-payment-status-check

| | |
|---|---|
| **Method** | POST |
| **Auth** | **`Authorization: Bearer <PAYMENT_RECONCILE_SECRET>`** |
| **Body** | `{ "online_payment_id": "..." }` and/or `{ "sale_id": "..." }` |
| **Steps** | 1. POST for United Payment pending row. |
| **Expected** | `online_payments` + `sales.payment_status` updated; no `order_status` bump in this fn. |
| **DB verify** | `SELECT status, epoint_status FROM online_payments WHERE id = '<id>';` |
| **Linked** | E-PAYM-01, X-PAY-04, X-PAY-05 |

---

## Coverage summary

| Group | Missing cases in this doc | Already executed (see master catalog) |
|-------|---------------------------|--------------------------------------|
| A | 11 (POS-04, KIOSK-10, ONLINE-01..05, TRACK-01..04) | POS-01..03, KIOSK-01..09 partial |
| C | 9 (OM-02..04, 07, 09, 12..14, 17) | OM-01, 05, 06, 08, 10, 11 fail, 15/16 inconclusive |
| D | 26 | PROD-01/02 fail, PROD-04 pass, SUPP-01/04/05 pass |
| E | 22 | SALE-01, OPEX-01, CAT-01, PAY-01, CASH-06 pass |
| F | 16 | SET-01/03 partial, DEL partial in Chrome run |
| G | 18 | All NOT RUN |
| H | 11 | SUP read-only partial, KOB-02 pass, STM partial |
| I | 5 | All NOT RUN |
| **Total** | **118** | **29 executed** (master catalog 147 total) |

### Cross-links

- Master matrix: [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md)
- Chrome re-run results: [functional-e2e-phase-chrome-results.md](./functional-e2e-phase-chrome-results.md)
- Adversarial (Group X): [functional-e2e-dynamic-cases.md](./functional-e2e-dynamic-cases.md)
- Ledger: [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md)

### Suggested execution order

1. **Read-only sanity** — E-HOME-01, E-MONY-01, E-RPT-01, E-LOC-01
2. **Staff writes (safe)** — D-MENU-*, D-COMB-*, E-OPEX/COGS/CASH, F-DEL settings
3. **Order lifecycle** — H-SUP/H-KOB with dedicated E2E test order
4. **Customer flows** — Group G + A-ONLINE + A-TRACK (after X-BUG-04 check)
5. **Payment lab** — Group I + E-PAYM-01 + Group X payment cases
6. **High-risk last** — F-USR-02, G-AUTH-06/07, live card

Update master catalog **Run status** and ledger after each execution batch.

