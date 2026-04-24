## Cursor → QA handoff

> **Claude Extension:** paste **this entire file** as the first user message in a new Extension chat (or reuse after `npm run qa:handoff` posts to Linear).

**Status:** ready for **manual** second-pass QA (live `sales` updates; requires real orders)

**Summary**

After the **`sales` RLS + workflow trigger** chain (`20260422100500`, `20260422103000`, `20260422104500`), staff (`staff@mings.az`) must be able to **`UPDATE` any in-scope sale** for Order Manager workflow, not only rows they created. This issue confirms the **full UI path** end-to-end with **no Supabase/RLS errors** for **delivery** and **takeaway** (online) orders.

**Acceptance criteria (Linear)**

- All **five operational steps** work without errors for **both** `online_delivery` and `online_takeaway` (and kiosk behaves like takeaway for dispatch).

**How the five steps map to the UI**

| Step | `order_status` transition | Order Manager UI |
|------|---------------------------|------------------|
| 1 Accept | `pending` → `preparing` | **New Orders** column → prep time chips → **Accept** (`t.omAccept`). If EPoint shows **Confirm payment**, tap it first (`payment_status` → paid). |
| 2 In progress | (stay `preparing`) | Order card moves to **In Progress** column automatically after accept. |
| 3 Ready | `preparing` → `ready` | **In Progress** card → **Ready** (`t.omMarkReady`). |
| 4 Dispatch | `ready` → `dispatched` | **Delivery only:** **Ready** column → choose **Self delivery** → **Confirm — Self Delivery** (`t.omConfirmSelfDispatch`). Order moves to **In Delivery** sub-tab under the third column. **Takeaway / kiosk:** there is **no** dispatch step — **Picked up** on the ready card completes the sale in one tap (see below). |
| 5 Complete | `dispatched` → `completed` (delivery) or `ready` → `completed` (takeaway) | **Delivery:** open **In Delivery** sub-tab → **Delivered** (`t.omDelivered`). **Takeaway/kiosk:** **Ready** column → **Picked up** (`t.omPickedUp`). |

**Surfaces / URLs**

- **Production:** `https://order.mings.az/order-manager` — sign in as `staff@mings.az`.
- **Local preview:** `http://127.0.0.1:4175/order-manager` after **`npm run deploy:local`** from repo root. Before testing, open `http://127.0.0.1:4175/build-meta.json` and confirm **`gitSha` equals `git rev-parse HEAD`** on the machine that built (stale `dist/` invalidates QA).

**Credentials / fixtures**

- **Account:** `staff@mings.az` (staff role — this is the RLS-sensitive path).
- **Password:** team secret; Playwright uses **`STAFF_PASSWORD`** from `.env.local` (see `.env.example`).
- **Data:** you need **one real `pending` order** per channel you test (`source` = `online_delivery` and `online_takeaway`), **not** scheduled (`scheduled_for` null for the “new” bucket). For delivery, prefer an order that is already **paid** so Accept is not blocked by **Confirm payment**.

**Scenarios to verify (blocking)**

1. **Delivery — full chain** — Run the five rows in the table above. After each action: no red **action error** strip at the top of Active Orders; order appears in the **expected column**; browser **Network** tab shows `PATCH .../rest/v1/sales` **204** (or success), not **401/403/425** with RLS body.
2. **Takeaway — full chain** — Accept → In Progress → Ready → **Picked up** (steps 1–3 then straight to complete; step 4 N/A). Same error/network checks.
3. **Regression — not creator** — Prefer an order whose **`created_by` is null or another user**, to prove the **post-RLS** path (staff updating someone else’s / anonymous checkout row).

**Optional automation smoke (no substitute for scenario 1–3)**

From repo root, with `STAFF_PASSWORD` set and optional `ORDER_MANAGER_VERIFY_URL=http://127.0.0.1:4175/order-manager`:

`npm run verify:fix -- --issue=MIN-10`

This only checks **shell load + column headers + no error banner**; it does **not** click through the workflow without orders.

**Backend reference (for QA / engineers)**

- `supabase/migrations/20260422100500_fix_staff_sales_update_policy.sql` — policy **`Staff, manager, admin can update sales`** + initial trigger.
- `supabase/migrations/20260422103000_expand_staff_workflow_update_columns.sql` — staff may touch workflow timestamps (`ready_at`, `dispatched_at`, `completed_at`, etc.).
- `supabase/migrations/20260422104500_allow_staff_complete_orders.sql` — staff may set `order_status` to **`completed`**.

**Commit** (fill when handing off a specific build)

- **Branch:** (your release or QA branch)
- **SHA:** must match `build-meta.json` → `gitSha` after `npm run deploy:local` on that checkout.

---

## Claude Extension — QA session (fresh context)

You are performing **second-pass QA** for **Ming’s OS**. You may not have the repo — use this file and Linear **MIN-10**.

### Linear

- **Issue:** MIN-10 — ORDER MANAGER — End to end workflow test after RLS fix  
- **Issue URL:** https://linear.app/mingsaz/issue/MIN-10/order-manager-end-to-end-workflow-test-after-rls-fix

### What to prove

Staff at `staff@mings.az` can drive **`sales`** from **pending → preparing → ready → dispatched → completed** for **delivery**, and **pending → preparing → ready → completed** for **takeaway**, with **no** permission or trigger errors.

### Evidence

- Short note per scenario: pass/fail, order `#` or id (non-sensitive), and any **error message text** from the UI or failed **REST** response body.
- Screenshots optional unless the team requires them.

### When you are done — record the result

1. Write markdown matching **Template B** in `docs/QA_COMMENT_TEMPLATES.md`.
2. From repo root (with Linear env if using CLI):  
   `npm run qa:result -- --issue=MIN-10 --status=pass|fail|blocked --result-file=<path-to-template-b.md>`

### Guardrails

- Prefer **test orders** or **local/staging** for state-changing clicks; avoid mutating real customer production orders without approval.
- Do **not** push to `main` from QA-only work.
