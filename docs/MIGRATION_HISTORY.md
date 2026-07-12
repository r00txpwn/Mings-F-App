# Migration history out of sync

## Quick fix (run in order)

```bash
npm run supabase:repair:remote
npm run supabase:push
npm run supabase:deploy:web
```

On Windows: `npm run supabase:repair:remote:ps` instead of `supabase:repair:remote`.

If `supabase:push` says **insert before the last migration** / suggests **`--include-all`**:

```powershell
npm run supabase:mark:history-gaps:ps
npm run supabase:push
```

**Do not run `db push --include-all`.** That re-runs old local SQL (including destructive migrations) against production.

If CLI fails with **TCP timeout** / **wsarecv** / **lock timeout** (port 5432 blocked from your network):

1. Open **Supabase Dashboard → SQL Editor** on the linked project (uses HTTPS, not direct Postgres from your PC).
2. Run [`scripts/supabase-mark-history-gaps-dashboard.sql`](../scripts/supabase-mark-history-gaps-dashboard.sql).
3. For KDS tonight only, run [`scripts/supabase-kds-policy-dashboard.sql`](../scripts/supabase-kds-policy-dashboard.sql).
4. Retry `npm run supabase:push` later from a network that can reach Postgres (or apply remaining migration SQL files manually in Dashboard).

Alternative CLI path when 5432 is blocked: use **Session pooler** URL from Dashboard → Database → Connect → `db push --db-url "postgresql://..."` (port **6543**).

If `supabase:push` errors with **relation already exists** / duplicate objects:

```bash
npm run supabase:mark:applied
npm run supabase:push
```

On Windows for mark-all: `npm run supabase:mark:applied:ps`.

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
npx supabase@latest migration repair --status reverted 20260109092518 20260214150414 20260307134418 20260307134421 20260426185945 20260427165528 20260428113335 20260428113345 20260428113354 20260428113407 20260428113416 20260428141858 20260428142121 20260428193000 20260428200000 20260615111226
```

Only revert versions **with no file** in `supabase/migrations/`. Never revert local migration IDs — use `npm run supabase:mark:history-gaps:ps` if history gaps appear.

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
- `20260422194244_ensure_rpc_request_phone_otp.sql` — idempotent **`otp_requests`** + **`rpc_request_phone_otp`** + `GRANT EXECUTE` (fixes **PGRST202** when `20260421174000_*` never ran on a host). Version matches Supabase MCP `apply_migration` record on the linked project.
- `20260423120000_online_settings_kitchen_pause.sql` — `online_settings.offline_until`, `closing_soon_minutes` (default 0), and **`Staff can manage online settings`** RLS extended to include **`manager`**.
- `20260423180000_expire_online_kitchen_pause_rpc.sql` — **`expire_online_kitchen_pause_if_due()`** (SECURITY DEFINER): when a timed pause has ended, sets `is_open=true` and clears `offline_until`; keeps indefinite close unchanged. Granted to **`anon`**, **`authenticated`**, **`service_role`** so Order App and edge can run it before reads.
- `20260621150000_sales_channels_soft_delete.sql` — adds **`sales_channels.is_deleted`** (soft delete; keeps FK integrity with **`sales`** / **`platform_payouts`**).
- `20260621160000_grant_users_service_role.sql` — restores **`GRANT`** on **`public.users`** for **`service_role`** (and **`authenticated` SELECT**) so **`user-management`** list/create/update no longer fail with *permission denied for table users*.
- `20260621170000_ensure_partner_sales_channels.sql` — re-activates **Wolt / Bolt / ChoiceQR** (`is_deleted = false`, `is_active = true`) and upserts canonical partner rows for manual **Sales** entry.
- `20260621180000_grant_admin_api_service_role.sql` — **`GRANT`** on **`sales_channels`**, **`admin_audit_log`**, and other **`admin-api`** tables for **`service_role`** (fixes Settings channel delete/toggle **400** from *permission denied*).
- `20260621190000_grant_combo_tables_and_staff_rls.sql` — **`GRANT`** on **`combo_deals`** / **`combo_groups`** / **`combo_group_items`** for **`authenticated`** (+ anon **SELECT**); staff RLS uses **`is_staff_user()`** (fixes Combos screen **403**).
- `20260621200000_sales_delivery_location_columns.sql` — adds **`sales.delivery_lat`**, **`delivery_lng`**, **`delivery_address`**, **`delivery_fee`**, **`delivery_zone_id`**, and related checkout fields (fixes Order map **column does not exist**).
- `20260622140000_ensure_system_sales_channels.sql` — restores **Wolt / Bolt / Kiosk / Online / POS** (`is_deleted = false`, `is_active = true`); upserts canonical **POS** row for Settings and **`pos-order-create`**.
- `20260622150000_protect_system_sales_channels_trigger.sql` — **DB trigger** blocks soft-delete, deactivation, and rename of required system channels (by canonical id or name); heals rows deleted before the trigger existed.
- `20260622160000_deduplicate_system_sales_channels.sql` — merges duplicate **POS / Kiosk / Online / Wolt / Bolt** rows onto canonical ids; reassigns `sales` and `platform_payouts`, then soft-deletes legacy duplicates (fixes two identical POS entries in Settings).
- `20260623180000_grant_suppliers_staff_read.sql` — **`GRANT SELECT`** on **`public.suppliers`** for **`authenticated`** + staff-only SELECT RLS (fixes Money / Expenses **permission denied for table suppliers** on purchase joins).
- `20260424155422_payment_reconciliation_log.sql` — **`payment_reconciliation_log`**: append-only audit columns for future payment reconciliation (`sale_id`, `provider`, `reconcile_trigger`, `candidate_reason`, `action`, `before_snapshot` / `after_snapshot`, `provider_response`, `error_message`); RLS on, no anon policies yet (service role / future RPC).
- `20260427102000_customer_auth_address_ux_mvp.sql` — adds customer checkout/legal metadata on `customer_profiles` (`first_name`, `last_name`, `phone_verified_at`, `terms_accepted_at`, version fields) and Wolt-style address detail columns on `customer_addresses` (`address_type`, access/courier/building/entry-point fields), all idempotent.
- `20260626150000_supplier_ledger_liabilities_bank_withdrawals.sql` — supplier ledger + finance debt: `suppliers.opening_balance` / `opening_balance_date`, `purchases.is_on_credit`, **`supplier_account_payments`** (lump-sum pay; distinct from legacy `supplier_payments`), **`liabilities`** / **`liability_payments`** (loans/other), **`bank_withdrawals`** (fee snapshots). RLS mirrors purchases. Redeploy **`admin-api`** after push (new table allowlist).
- `20260626163000_finance_grants_and_supplier_debts.sql` — **`GRANT SELECT`** on finance tables for **`authenticated`** + full DML for **`service_role`** (fixes *permission denied for table liabilities*); adds **`supplier_debts`** (dated manual debt entries per supplier) and migrates legacy **`opening_balance`** into debt rows. Redeploy **`admin-api`** (`supplier_debts` allowlist).
- `20260626180000_cash_drawer_ledger.sql` — cash reconciliation: adds **`sales.payment_method`** + **`sales.paid_at`** (POS captures cash/card; "mark paid" stamps method + time) and creates **`cash_movements`** (opening float / bank deposit / adjustment) with RLS + grants. Cash-on-hand is derived (paid cash orders − cash expenses / supplier / liability payments ± movements). Redeploy **`admin-api`** (`cash_movements` allowlist) and **`pos-order-create`** (persists `payment_method`).
- `20260627120000_taxes_and_payroll.sql` — staff + tax modules: **`employees`**, **`salary_payments`** (dated ledger: salary/advance/partial/bonus), singleton **`tax_settings`** (configurable AZ rates), **`tax_payments`** (sales/payroll tax paid log). RLS + grants. **2026-06-29:** Taxes cockpit UI and estimation removed; **`employees`** / **`salary_payments`** remain active on **`?screen=staff`**; **`tax_settings`** / **`tax_payments`** orphaned in DB. Redeploy **`admin-api`** (`employees`, `salary_payments` allowlist). See **`docs/TAXES_PAYROLL.md`**.
- `20260628140000_grant_audit_tables_select_authenticated.sql` — **`GRANT SELECT`** on **`admin_audit_log`** and **`audit_logs`** for **`authenticated`** (fixes Audit Log screen permission denied before RLS).
- `20260628162755_grant_audit_tables_select_authenticated.sql` — **same SQL as `20260628140000_*`**; remote history version when applied via Supabase MCP (keeps `db push` in sync — do not delete).
- `20260628150000_online_settings_special_days.sql` — **`online_settings.special_days_json`** (JSONB array): one-off Baku dates that override weekly `hours_json` (closed all day or custom hours) with optional per-language customer notes for the `/order` portal. See **`docs/KITCHEN_HOURS.md`**. Redeploy **`online-order-create`** after push so server-side acceptance honors special days.
- `20260628160000_finance_accounts_and_transfers.sql` — three-account ledger Phase 1: **`finance_accounts`** (opening balances for cash/bank/card) and **`account_transfers`** (internal moves, e.g. Main → Card). Cockpit derives **Cash on Hand** (existing drawer), **Main (bank)**, and **Card** balances. Redeploy **`admin-api`** (`finance_accounts`, `account_transfers` allowlist).
- `20260629010000_purchases_payment_method.sql` — Phase 1.5 COGS routing: adds **`purchases.payment_method`** so a "paid now" purchase (`is_on_credit = false`) records the account it was paid from (cash/card/bank_transfer) and deducts from that balance. "On account" purchases stay null (money moves later via `supplier_account_payments`). `purchases` already in the **`admin-api`** allowlist — no redeploy needed.
- `20260629020000_platform_payouts_received_account.sql` — Phase 2 payout routing: adds **`platform_payouts.received_account`** (`cash` | `bank` | `card`, nullable + CHECK). When set, the payout **credits** that account balance — Wolt → Main bank, Bolt → Card, ChoiceQR → Cash on hand. `NULL` = legacy/report-only (no balance impact). Bank/Card payouts flow through `accountsService` + the Bank/Card activity ledger; Cash payouts flow through the cash drawer (`Cash payouts received` line). `platform_payouts` already in the **`admin-api`** allowlist — no redeploy needed. (ChoiceQR sales channel re-activated so it is selectable in the Payouts picker.)
- `20260630120000_salary_payments_pay_period.sql` — adds **`salary_payments.period_start`** / **`period_end`** (nullable dates + `period_end >= period_start` CHECK) so each salary payment records the **pay period it covers** (e.g. 1–30 June, or 15–30 for a mid-month joiner), distinct from `payment_date` (day money went out). Surfaced as a "Pay period" range picker on **`?screen=staff`** (defaults to the current month). `NULL` = legacy/no period (advances, bonuses). `salary_payments` already in the **`admin-api`** allowlist — no redeploy needed.
- `20260701120000_delivery_orders_sale_id_unique.sql` — **`UNIQUE (sale_id)`** on **`delivery_orders`** so **`wolt-drive-manual-dispatch`** upsert and dispatch tab manual mark work reliably (one delivery row per sale).
- `20260712143000_add_atomic_direct_order_persist.sql` — **`sales.client_request_id`** / **`client_request_hash`**, partial unique index, and **`persist_direct_order(jsonb)`** (service_role only): atomic sale + line + modifier insert with idempotency. Redeploy **`online-order-create`** and **`kiosk-order-create`** after push.
- `20260712144500_harden_direct_order_rls.sql` — **second release only** (after sandbox QA): drops direct anon/authenticated inserts on kiosk/online order tables and revokes public allocator RPC grants. Do **not** apply until **`kiosk-order-create`** + updated **`CheckoutScreen`** are live on that project.
- `20260712150000_finance_amounts_three_decimals.sql` — cockpit finance amount columns (`operational_expenses`, `purchases`, payroll, liabilities, supplier ledger, cash movements, transfers, tax payments) widened to **`numeric(12,3)`** so expenses/COGS can store milli-qəpik (e.g. 1.255 ₼). Sales/menu prices unchanged.
- `20260712151000_purchases_discount_percent.sql` — adds **`purchases.discount_percent`** (0–100). COGS forms store list **`unit_cost`** and compute **`total_cost = qty × unit_cost × (1 − discount/100)`**.
- `20260712152000_user_preferences_per_user.sql` — adds **`user_preferences.user_id`** (unique per auth user), removes legacy global rows, and scopes RLS to **`auth.uid()`** so language choice persists per user instead of resetting to English.
