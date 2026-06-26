# KDS Chowbus-Style Redesign — Design Spec

**Status:** Draft — awaiting owner approval  
**Date:** 2026-06-18  
**Scope:** Full kitchen display parity with Chowbus-style UX (columns, item checkoffs, filters, undo, search/history)

---

## 1. Goals

| Goal | Success metric |
|------|----------------|
| Kitchen staff see **what to cook next** without reading full cards | Column layout + color-coded channel headers |
| **Tap feedback is instant** | Optimistic UI + item toggles + undo toast |
| **Item-level progress** | Each line item can be marked prepared (green check) |
| **Works on tablet** in dark kitchen | 44px+ tap targets, horizontal scroll columns |
| **No staff login** on `/kds` | Anon client + edge functions + RLS (existing model) |

Out of scope for v1: native mobile app, printer integration, multi-location routing, Chowbus POS sync.

---

## 2. Reference mapping (Chowbus → Mings)

| Chowbus UI | Mings equivalent |
|------------|------------------|
| Delivery / Dine In / Take Out header colors | `online_delivery` / `kiosk` / `online_takeaway` |
| Order # + elapsed timer + PAID | `display_number` + elapsed + payment badges (existing) |
| Customer name + phone | `sales.customer_name`, `sales.customer_phone` |
| Order note | `sales.delivery_notes` + item `notes` |
| Item check circle | **New:** `sale_items.prepared_at` |
| Column by stage | **New:** Pending \| Preparing \| Ready kanban |
| Filter pills | All / Delivery / Takeaway / Kiosk |
| Complete + Undo (5s) | **New:** undo stack on `completed` |
| Search | Filter by `display_number` prefix |
| History | Completed orders today (collapsible panel) |
| RUSH tag | **v1.1:** manual `sales.kds_rush` flag |
| ADD / CHANGED | **Deferred:** needs order revision model |
| VOID line | **Deferred:** needs voided line item column |

---

## 3. Architecture

### 3.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [All][Delivery][Takeaway][Kiosk]  🔍 #___   🔄   📋 History   🟢  EN…  │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│ PENDING (n)      │ PREPARING (n)    │ READY (n)                         │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐                  │
│ │ DELIVERY #23 │ │ │ TAKEOUT #21  │ │ │ KIOSK #19    │  ← horizontal   │
│ │ 00:29  PAID  │ │ │ 04:12  CASH  │ │ │ 01:05  PAID  │    scroll on    │
│ │ Ali · +994…  │ │ │ items ○/✓    │ │ │ [Complete]   │    narrow view  │
│ │ ○ 2× Item    │ │ │ [Mark Ready] │ │ └──────────────┘                  │
│ │ [Start prep] │ │ └──────────────┘ │                                   │
│ └──────────────┘ │                  │                                   │
└──────────────────┴──────────────────┴───────────────────────────────────┘
        ▲ toast: "Order #19 complete  (5s Undo)"
```

- **Desktop/tablet landscape:** three equal columns, vertical scroll within column.
- **Mobile/narrow:** single column with tabs or swipe between Pending/Preparing/Ready (Phase 3 polish; Phase 1 can use horizontal scroll of columns).

### 3.2 Component split

| Component | Responsibility |
|-----------|----------------|
| `KitchenDisplay.tsx` | Data fetch, realtime, filters, search, undo queue |
| `KdsBoard.tsx` | Three-column layout |
| `KdsColumn.tsx` | Column header + scrollable card list |
| `KdsOrderCard.tsx` | Header strip, customer meta, items, actions |
| `KdsLineItem.tsx` | Check toggle, modifiers, notes |
| `KdsHeader.tsx` | Filters, search, connection, language |
| `KdsUndoToast.tsx` | 5s undo after complete |
| `KdsHistoryDrawer.tsx` | Today's completed orders (read-only) |

Replace monolithic `OrderCard.tsx` gradually; keep old file until cutover.

### 3.3 Data flow

```
KDS (anon) ──SELECT──► sales + sale_items (+ modifiers)
         ──realtime──► sales INSERT/UPDATE, sale_items UPDATE
         ──POST──────► kds-order-status-update (order-level)
         ──POST──────► kds-item-prep-toggle (item-level) [new]
```

---

## 4. Database changes

### 4.1 Migration `20260619120000_kds_item_prep_and_anon_update.sql`

```sql
-- Item prep timestamp (null = not prepared)
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS prepared_at timestamptz;

-- Optional v1.1 rush flag
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS kds_rush boolean NOT NULL DEFAULT false;

-- Anon may toggle prepared_at on items belonging to kitchen-queue sales
CREATE POLICY "Anon can update sale item prep on kitchen queue"
  ON sale_items FOR UPDATE TO anon
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND s.source IN ('kiosk', 'online_delivery', 'online_takeaway')
        AND s.order_status IN ('pending', 'preparing', 'ready')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND s.source IN ('kiosk', 'online_delivery', 'online_takeaway')
        AND s.order_status IN ('pending', 'preparing', 'ready')
    )
  );
```

**Alternative considered:** store prep state only in React (localStorage). **Rejected** — lost on refresh, no cross-device sync, kitchen has multiple tablets.

**Trigger (optional):** when all items have `prepared_at` set and order is `preparing`, show pulsing "Mark Ready" hint — no auto status change.

### 4.2 Realtime

Already on `sale_items` publication. Subscribe to `UPDATE` on `sale_items` in addition to `sales`.

### 4.3 TypeScript

Update `SaleItem` in `src/lib/supabase.ts`: `prepared_at?: string | null`.

---

## 5. Edge functions

### 5.1 `kds-item-prep-toggle` (new)

- **Auth:** `x-kds-secret` (same as status update)
- **Body:** `{ saleItemId: string, prepared: boolean }`
- **Logic:** service role updates `prepared_at` = now() or null; validate sale is in kitchen queue
- **Why edge function vs direct anon UPDATE:** tighter validation, audit log, consistent with hardened RLS direction

**Alternative:** direct anon PATCH from client. **Recommended for speed in Phase 2** if edge deploy is friction; switch to edge if abuse appears.

### 5.2 Extend `kds-order-status-update`

- On `preparing`: optionally reset all `sale_items.prepared_at` to null
- On `completed`: keep items as-is (history)

### 5.3 Undo

- Client keeps `{ saleId, previousStatus, previousReadyAt, timeoutId }` for 5s
- Undo calls `kds-order-status-update` with previous status
- Only for `completed` → revert to `ready` (Chowbus pattern)

---

## 6. UI specification

### 6.1 Channel header colors

| Source | Header bg | Label key |
|--------|-----------|-----------|
| `online_delivery` | `rose-500` | `kdsChannelDelivery` |
| `online_takeaway` | `orange-500` | `kdsChannelTakeaway` |
| `kiosk` | `amber-400` | `kdsChannelKiosk` |

### 6.2 Item row

- Left: circle button 44×44 — empty ○ / filled ✓ (green)
- Center: `qty× name`, modifiers indented, item notes in amber
- Tap toggles prep (optimistic + spinner on row)
- Combo: parent row + indented combo lines (existing structure); **each combo sub-line is its own checkable row** (flatten for display)

### 6.3 Order actions (unchanged rules)

- Pending + payment OK → Start Preparing (+ prep time picker)
- Preparing → Mark Ready (enabled always; **highlight** when all items checked)
- Ready → Complete → undo toast

### 6.4 Filters & search

- **Filters:** client-side on loaded orders (`source`)
- **Search:** input filters `display_number` / `#M042` case-insensitive
- **History drawer:** query `sales` where `order_status = 'completed'` and `ready_at` or `updated_at` today — anon read policy may need extension or edge read function

**History RLS note:** anon currently reads only pending/preparing/ready. History requires either:
- **A)** Edge function `kds-completed-today` (service role, KDS secret), or
- **B)** New RLS policy: anon SELECT completed kitchen orders from today only

Recommend **B** with tight `USING` clause on `completed_at`/`ready_at` >= start of day Baku TZ.

### 6.5 Translations

New keys (en/az/ru): `kdsChannelDelivery`, `kdsChannelTakeaway`, `kdsChannelKiosk`, `kdsFilterAll`, `kdsSearchPlaceholder`, `kdsHistoryTitle`, `kdsUndoComplete`, `kdsUndoSeconds`, `kdsAllItemsPrepared`, `kdsMarkItemPrepared`, `kdsMarkItemUnprepared`.

---

## 7. Implementation phases

### Phase 1 — Board + visual parity (3–4 days)

- [ ] `KdsBoard` + three columns
- [ ] Colored channel headers, customer phone/name
- [ ] Filter pills + search by order #
- [ ] Undo toast on complete
- [ ] Keep order-level actions; migrate optimistic UX
- [ ] Deploy staff + docs update

### Phase 2 — Item checkoffs (2–3 days)

- [ ] Migration `prepared_at` + RLS or edge toggle
- [ ] `KdsLineItem` check UI + realtime on sale_items
- [ ] "All items prepared" hint on Mark Ready
- [ ] Unit tests for prep toggle validation

### Phase 3 — History + polish (2 days)

- [ ] Completed-today drawer + RLS or edge read
- [ ] Rush flag (optional)
- [ ] Narrow viewport column tabs
- [ ] E2E smoke: cash order → item checks → ready → complete → undo

**Total estimate:** ~7–9 dev days + QA on staging KDS

---

## 8. Testing

| Test | Type |
|------|------|
| Column placement by status | Unit |
| Filter/search reduces visible cards | Unit |
| Item toggle optimistic + revert on error | Unit |
| Undo restores ready + reappears in Ready column | E2E |
| Card unpaid online → no start prep | E2E (existing) |
| Realtime new order appears in Pending | E2E |
| Anon cannot toggle item on completed sale | Integration / RLS |

---

## 9. Deployment order

1. Supabase migration + `kds-item-prep-toggle` edge function
2. `npm run supabase:deploy:kds-status` (+ new function script)
3. Staff frontend `vercel deploy --prod --local-config vercel.staff.json`
4. Smoke on production `/kds?key=…` during quiet hour

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Git auto-deploy overwrites staff bundle | Lock Vercel `build:staff` + `dist-staff` on `mings-f-app` |
| Item toggle abuse via anon | Edge validation + audit log |
| History RLS too broad | Time-boxed + source filter + status = completed only |
| Scope creep (ADD/VOID) | Explicitly deferred to v2 |

---

## 11. Approval

Owner selected **Option C — full Chowbus including item checkoffs**.

**Please review this spec.** Reply with approval or changes; then we will write the step-by-step implementation plan (`writing-plans`) and begin Phase 1.
