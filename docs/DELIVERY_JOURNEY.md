# Delivery journey — single source of truth

This document describes the end-to-end **customer-to-doorstep** flow for Mings-F-App, failure modes, lightweight mitigations, the **manual Wolt Drive** staff playbook, a prioritized feature roadmap, and when to adopt the **Wolt Drive API**.

> **Admin surface:** delivery zones, kitchen/online settings, and live dispatch are all managed from the **Delivery Control Center** in the staff cockpit at `/delivery` (tabs: Zones, Settings, Dispatch). Polygons are edited by pasting GeoJSON — draw the shape at [geojson.io](https://geojson.io), copy the `geometry`, paste it in the zone editor, and a live map preview confirms the shape before saving. See [`src/screens/DeliveryScreen.tsx`](../src/screens/DeliveryScreen.tsx) and the `delivery_zones` / `online_settings` tables.

---

## 1. Overview (stages)

```
Browse menu → Cart → Checkout → Order submit → Kitchen (KDS) receives →
Prepare & mark ready → Staff books Wolt manually → Courier delivers →
Staff completes → Customer sees status on /track
```

**Nine stages**

| # | Stage | Primary surfaces / code |
|---|--------|-------------------------|
| 1 | Customer browses menu | `src/order/OrderApp.tsx`, menu hooks |
| 2 | Customer adds to cart | `OrderApp.tsx` cart state; optional `localStorage` persistence |
| 3 | Customer enters checkout | `OrderApp.tsx`, `OrderAddressMap.tsx` |
| 4 | Order submission | `supabase/functions/online-order-create/index.ts` |
| 5 | Kitchen receives order | `src/kds/KitchenDisplay.tsx` |
| 6 | Kitchen prepares & marks ready | `src/kds/OrderCard.tsx`, status updates on `sales` |
| 7 | Staff books Wolt (manual) | Wolt Drive web portal + `KioskOrdersBoard` dispatch footer |
| 8 | Courier picks up & delivers | Wolt portal; staff may mark completed in-app |
| 9 | Order complete / customer tracking | `src/order/TrackingApp.tsx` |

---

## 2. Stage-by-stage: today, failures, lightweight fixes

### Stage 1–2 — Browse / cart

- **Today:** Cart is managed in the order UI; persistence may use `localStorage` for refresh survival.
- **Same product, different modifiers:** Cart lines are keyed by **product + selected modifier option IDs**, so the same dish with different modifier sets (e.g. two guests wanting different spice levels) appears as **separate lines**. Add the item once per modifier configuration.
- **Fail:** Cart lost on refresh → **Fix:** persist cart key (e.g. `mings_cart_v1`).
- **Fail:** Item unavailable after add → **Fix:** `online-order-create` re-validates products and modifiers (reject with 400).

### Stage 3 — Checkout

- **Today:** Name, phone, address (delivery), map picker (AZ), zone + fee preview, payment method.
  - **Address picker:** Places API (New) autocomplete restricted to Baku bounds, draggable pin for fine-tune, reverse-geocode on pin drag or geolocation (see `src/order/AddressAutocomplete.tsx`, `OrderAddressMap.tsx`, `googleMapsLoader.ts`).
  - **Apartment + floor** captured as separate fields (`sales.delivery_apartment`, `sales.delivery_floor`; mirrored on `customer_addresses` for logged-in reuse — migration `20260420140000_delivery_address_details.sql`).
  - **Courier notes** — free-text buzzer / entry-code / gate instructions captured in `sales.delivery_notes` (existing column).
  - **Live zone pill** under the search input — teal when inside an active zone (shows zone name + fee), red when outside.
  - **Zone polygons** rendered on the map; the matched zone is highlighted in the cockpit accent color.
- **Fail:** Outside zone → UI shows outside-zone pill + full error card with "switch to takeaway" CTA before submit.
- **Fail:** Wrong phone → add `+994` hint and format guidance; backend requires minimum phone length.
- **Fail:** Missing flat/buzzer → dedicated apartment + floor fields plus the courier-notes textarea below them.

### Stage 4 — Submission

- **Today:** Edge function creates `sales`, `sale_items`, modifiers; delivery zones via polygon; min order checks.
- **Fail:** Network error → friendly error + retry UX.
- **Fail:** Response lost after create → optional future: recovery via last-order token in `localStorage` (P2).

### Stage 5 — KDS receive

- **Today:** Realtime on `sales`; optional new-order audio; connection indicator in header.
- **Fail:** Missed order → beep + visible offline banner when Realtime is not `SUBSCRIBED`.
- **Fail:** Split-brain devices → Realtime reconnect; tap banner to resubscribe.

### Stage 6 — Prepare / ready

- **Today:** Status `pending` → `preparing` → `ready`; `prep_started_at`, optional `estimated_ready_at` for countdown.
- **Fail:** Unpaid online payment → payment badges hide “Start preparing” until paid.
- **Fail:** Wrong order → large display number on card.

### Stage 7 — Manual Wolt dispatch

- **Today:** Auto `wolt-drive-create` runs only if `WOLT_API_TOKEN` is set (optional API path). Default: staff use **Copy all for Wolt**, open portal, paste **tracking URL**, save → `dispatched`.
- **Fail:** Forgot to dispatch → orders in **Ready** show dispatch actions.
- **Fail:** Wrong address in portal → copy buttons for address, phone, name, notes.
- **Fail:** Double booking → 60s lock after “Open Wolt” via Realtime broadcast.

### Stage 8 — Delivery

- **Fail:** Customer unreachable → phone + notes on clipboard for portal.
- **Fail:** Staff forgets to complete → optional future auto-complete (P3).

### Stage 9 — Tracking

- **Today:** Public RPC `get_sale_tracking_public`; optional Realtime refresh; Wolt link when `delivery_orders.tracking_url` is set.

---

## 3. Manual Wolt Drive — staff playbook

1. New delivery order appears in **KDS** and **Kiosk orders** board.
2. Confirm payment expectation (cash/COD vs online); for **online unpaid**, do not prepare until paid.
3. **Start preparing** (pick prep time if prompted) → kitchen cooks.
4. **Mark ready** when food is packed.
5. For **online delivery** in **Ready**:
   - Click **Copy all for Wolt** → paste into Wolt Drive portal.
   - Click **Open Wolt** → portal opens with phone search hint.
   - After Wolt returns a **tracking URL**, paste into the field and **Save** → order moves to **Dispatched**; customer `/track` shows **Track on Wolt**.
6. When delivery is done, move card to **Done** (completed).

---

## 4. Feature roadmap (effort tags)

| Priority | Effort | Feature |
|----------|--------|---------|
| P0 | S | Staff dispatch workflow (copy all, portal link, URL save) |
| P0 | XS | Double-dispatch lock (~60s) |
| P0 | XS | Payment badges on KDS / kiosk cards |
| P0 | XS | KDS offline banner + heartbeat |
| P0 | XS | Courier notes on checkout |
| P0 | XS | New-order alert on KDS (audio) |
| P1 | S | Realtime on `/track` |
| P1 | XS | Prominent “Track on Wolt” button |
| P1 | XS | Friendly status labels |
| P1 | S | Cancel order with reason |
| P2 | M | Delayed-order messaging on track |
| P2 | M | Order-attempt recovery after network drop |
| P3 | L | SMS with tracking link |
| P3 | L | Full Wolt Drive API (when volume justifies) |

---

## 5. When to switch to Wolt Drive API

Enable when:

- Order volume justifies automation and staff time saved.
- `WOLT_API_TOKEN` and merchant credentials are configured in Supabase.
- `online-order-create` can call `wolt-drive-create` after sale insert (already gated on token).

Until then, **manual portal + tracking URL paste** is the supported path; the stub/API function can create or update `delivery_orders` as integration matures.

---

## 6. Related files

| Area | Path |
|------|------|
| Order create | `supabase/functions/online-order-create/index.ts` |
| Wolt stub/API | `supabase/functions/wolt-drive-create/index.ts` |
| Manual dispatch | `supabase/functions/wolt-drive-manual-dispatch/index.ts` |
| KDS | `src/kds/KitchenDisplay.tsx`, `src/kds/OrderCard.tsx` |
| Management board | `src/components/kiosk/KioskOrdersBoard.tsx` |
| Tracking | `src/order/TrackingApp.tsx` |
| Address | `src/order/OrderAddressMap.tsx` |
