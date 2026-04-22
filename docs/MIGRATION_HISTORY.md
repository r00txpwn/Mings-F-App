# Migration history out of sync

## Quick fix (run in order)

```bash
npm run supabase:repair:remote
npm run supabase:push
npm run supabase:deploy:web
```

If `supabase:push` errors with **relation already exists** / duplicate objects:

```bash
npm run supabase:mark:applied
npm run supabase:push
```

On Windows **without Git Bash**, use: `npm run supabase:repair:remote:ps` and `npm run supabase:mark:applied:ps`.

---

If `npm run supabase:push` says:

> Remote migration versions not found in local migrations directory

your **hosted** database has migration records that **aren’t in this git repo** (another machine, old branch, or renamed files). The **schema** is usually fine; only the **history table** is wrong.

## Step 1 — Repair orphan remote versions

From repo root (PowerShell):

```powershell
.\scripts\supabase-repair-remote-orphans.ps1
```

Or manually:

```bash
npx supabase@latest migration repair --status reverted 20260109092518 20260109114111 20260109115610 20260109125611 20260109125652 20260109130841 20260109130857 20260109135107 20260109140037 20260111090552 20260129132659 20260129140936 20260131131918 20260131133116 20260131144024 20260214150336 20260214150414 20260214152949 20260226085127 20260226085137 20260226094917 20260226101729 20260307134418 20260307134421 20260307134713
```

This **does not** drop tables; it only fixes `supabase_migrations` rows that point at missing files.

## Step 2 — Push local migrations

```bash
npm run supabase:push
```

## Step 3 — If push fails with “already exists”

The DB already has objects your migrations try to create. Then mark **local** migrations as applied without running them:

```powershell
.\scripts\supabase-mark-local-applied.ps1
```

After that, `npm run supabase:push` should only apply **new** migrations (e.g. `20260322100000_*`).

## Alternative: pull remote schema

If you prefer the **remote** schema as truth and want to regenerate local SQL:

```bash
npx supabase@latest db pull
```

Review the generated file(s), then commit. This is a larger workflow; prefer repair + push for most cases.

## Then deploy functions

```bash
npm run supabase:deploy:web
```

---

## Recent combo migrations

- `20260418140100_combo_deals.sql` — combo tables + sale item combo fields + upsell eligibility flag.
- `20260418153000_add_products_upsell_combo_id.sql` — explicit product-to-combo upsell mapping.
- `20260418191000_combo_discount_fields.sql` — combo discount config foundation columns (`discount_*`) with non-negative constraint.
- `20260418200000_add_scheduled_orders.sql` — adds `sales.scheduled_for` and `sales.reminder_at` for order-manager scheduled flow.
- `20260419120000_online_settings_is_open_sales_cancellation_reason.sql` — `online_settings.is_open` (kitchen closed gate for `/order` checkout) and `sales.cancellation_reason` (customer-facing cancel reason on `/track`).
- `20260422100500_fix_staff_sales_update_policy.sql` — `sales` RLS: **`Staff, manager, admin can update sales`** (staff no longer limited to rows they created); adds `enforce_staff_sales_workflow_update` trigger (initial allowed columns).
- `20260422103000_expand_staff_workflow_update_columns.sql` — extends staff workflow column allowlist (`ready_at`, `dispatched_at`, `completed_at`, `reminder_at`, `cancellation_reason`, `payment_status`, …).
- `20260422104500_allow_staff_complete_orders.sql` — staff may set `order_status` to **`completed`** (picked up / delivered).
- `20260422200000_wolt_booking_lock_and_scheduled_guard.sql` — `delivery_orders.wolt_booking_locked_until` (persisted Wolt portal booking lock; filename is historical).
- `20260422201000_kiosk_anon_update_cancellation_reason_bound.sql` — tighter `WITH CHECK` on anon kiosk `sales` updates for `cancellation_reason`.
- `20260422210000_products_combo_soft_delete_scheduled_future.sql` — `products.is_deleted` / `combo_deals.is_deleted`, combo storefront policy, `sales` trigger so `scheduled_for` stays in the future when scheduling changes.
