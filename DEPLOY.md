# Deploy Mings

## What runs locally

- `npm run build:staff` → `dist-staff/` (sp.mings.az, pos.mings.az — cockpit, order-manager, KDS, kiosk, POS)
- `npm run build:storefront` → `dist-storefront/` (order.mings.az — menu + tracking)
- `npm run build:all` → both artifacts
- `npm run deploy:local` → staff preview on **http://127.0.0.1:4175/** (kills port 4175 first, `--strictPort`)
- `npm run deploy:local:storefront` → storefront preview on **http://127.0.0.1:4176/** (kills port 4176 first)
- `npm run dev:staff` → **http://127.0.0.1:5173/** (kills port 5173 first)
- `npm run dev:storefront` → **http://127.0.0.1:5174/** (kills port 5174 first)

## 1. Frontend (two Vercel projects — recommended)

Deploy **separate** static bundles so customer-facing JS never ships admin cockpit code.

| Vercel project | Domain | Build command | Output directory | Config file |
|----------------|--------|---------------|------------------|-------------|
| `mings-staff` | `sp.mings.az` | `npm run build:staff` | `dist-staff` | [`vercel.staff.json`](vercel.staff.json) |
| `mings-order` | `order.mings.az` | `npm run build:storefront` | `dist-storefront` | [`vercel.storefront.json`](vercel.storefront.json) |

See **[docs/VERCEL_SPLIT_DEPLOY.md](docs/VERCEL_SPLIT_DEPLOY.md)** for `vercel link` + deploy commands (wrong link ships the wrong bundle).

In each Vercel project **Settings → General**:

1. Set **Root Directory** to repo root (default).
2. Override **Build Command** and **Output Directory** as in the table.
3. Copy the matching `vercel.*.json` into the project root as `vercel.json`, **or** point Vercel at the file if using monorepo config.

### Staff project env (`sp.mings.az`)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_SURFACE_ADMIN_HOSTS=sp.mings.az`
- `VITE_PUBLIC_ORDER_URL=https://order.mings.az`
- **`VITE_KIOSK_SECRET`** (staff only — do not set on storefront project)
- Optional: `VITE_PUBLIC_KIOSK_URL=https://sp.mings.az/kiosk`

### Storefront project env (`order.mings.az`)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_SURFACE_ORDER_HOSTS=order.mings.az`
- `VITE_GOOGLE_MAPS_API_KEY` (delivery map)
- **Do not** set `VITE_KIOSK_SECRET` here

Auth sessions use separate storage keys (`mings-staff-auth` vs `mings-storefront-auth`) so staff and customer logins do not bleed across origins.

### Legacy single-build deploy

The root [`vercel.json`](vercel.json) remains for backward compatibility but ships **one** bundle with all surfaces. Prefer the split deploy above for production.

### Vercel CLI (single project — legacy)

1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. From repo root: `vercel` (first time) then `vercel --prod`
3. In the Vercel project **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional: `VITE_GOOGLE_MAPS_API_KEY` (delivery map on `/order`), `VITE_KIOSK_SECRET`
   - **Production KDS:** `/kds` requires **staff login** (same as `/pos`). Bookmark `https://sp.mings.az/kds` on kitchen tablets; sign in once per device. `VITE_KDS_SECRET` is no longer used.
   - Optional subdomain split: `VITE_SURFACE_ADMIN_HOSTS`, `VITE_SURFACE_ORDER_HOSTS`, `VITE_SURFACE_KIOSK_HOSTS`, `VITE_SURFACE_KDS_HOSTS`, `VITE_SURFACE_TRACK_HOSTS` (comma-separated exact hostnames; see [.env.example](.env.example)).
   - Optional public links from staff: `VITE_PUBLIC_ORDER_URL`, `VITE_PUBLIC_KIOSK_URL` (full URLs).

`vercel.json` in this repo configures SPA rewrites so `/order`, `/track`, `/kiosk`, `/kds` work.
It also sets a global CSP header; keep `connect-src` allowing both `https://*.supabase.co` and `wss://*.supabase.co` so Supabase Realtime WebSocket connections work.

PWA assets are served from `public/manifest.webmanifest` and `public/sw.js`. Ensure these files are included in your static deploy output.

### Subdomains (optional, same build)

1. **DNS:** Add `A`/`CNAME` records for e.g. `app.`, `order.`, `kiosk.` pointing at your static host (or Vercel as documented).
2. **Vercel / Netlify:** Add each hostname to the project so TLS is issued for all of them (one deployment, multiple domains).
3. **Env:** Set `VITE_SURFACE_*` lists so `order.yourdomain.com` loads the storefront at `/` without the `/order` path; `app.yourdomain.com` loads the staff cockpit at `/`.
4. **Supabase Auth:** If staff and storefront use different registrable domains, add every auth redirect URL in Supabase **Authentication → URL configuration** (same parent domain usually works with defaults).
5. **Edge `APP_BASE_URL`:** Set to the **canonical online storefront origin** (e.g. `https://order.yourdomain.com` when using an order subdomain) so Epoint return URLs and payment flows match where customers land. If the menu is served at `/` on that host, set Edge secret **`APP_STOREFRONT_PATH=/`** (see [.env.example](.env.example)).

### Supabase Auth settings (recommended baseline)

In **Authentication → Providers / Settings**:

- Turn on **Confirm sign up** for email/password users.
- Turn on **Reset password** so storefront users can recover accounts from `/order`.
- Keep `Site URL` set to your primary storefront origin (example: `https://order.mings.az`).
- Add allowed redirects for every live surface origin that can start auth (for this project: `https://order.mings.az/**` and `https://sp.mings.az/**`).
- For Google OAuth, ensure provider credentials are configured in Supabase and in Google Cloud, with callback `https://<project-ref>.supabase.co/auth/v1/callback`.

**Subdomain smoke checks (after DNS + env propagate):**

- [ ] `https://app.yourdomain.com/` loads staff login / cockpit.
- [ ] `https://order.yourdomain.com/` loads the online menu (same as `/order` on a single-host deploy).
- [ ] `https://kiosk.yourdomain.com/` loads kiosk (if configured).

### Netlify

1. `npm i -g netlify-cli`
2. `netlify deploy --prod --dir=dist` (after `npm run build`)
3. Set the same `VITE_*` env vars in Netlify UI.

`netlify.toml` handles SPA fallback.

### Any other static host

Upload `dist/` and configure **all routes → `index.html`** (200), same as above.

---

## 2. Supabase (database + Edge Functions)

Requires [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Migrations

```bash
supabase db push
```

**From this repo (uses local `tools/supabase` on Windows when present, else `npx`):**

```bash
npm run supabase:push
```

**Windows:** if `npx supabase` fails with “No matching … win32-x64”, download [Supabase CLI](https://github.com/supabase/cli/releases) (`supabase_windows_amd64.tar.gz`) into `tools/` (see `scripts/run-supabase-cli.mjs`). Then run `tools/supabase.exe login` and `tools/supabase.exe link --project-ref $(node scripts/get-supabase-ref.mjs)`.

Recent online-order schema additions included in this repo:

- `20260421153000_scheduled_slots.sql` (`sales.is_scheduled`, `online_settings.scheduled_slot_minutes`, `online_settings.scheduled_lead_minutes`)
- `20260421161000_add_product_halal_flag.sql` (`products.is_halal`)
- `20260421174000_checkout_promos_loyalty_errors.sql` (`sales.discount_amount`, `sales.tip_amount`, `sales.promo_code`, `promo_codes`, `dispatch_failures`, OTP rate-limit RPC)
- `20260421182500_customer_favorites.sql` (`customer_favorites`)
- `20260421194000_online_settings_kitchen_location.sql` (`online_settings.kitchen_lat`, `online_settings.kitchen_lng`)
- `20260422200000_wolt_booking_lock_and_scheduled_guard.sql` (`delivery_orders.wolt_booking_locked_until` — Wolt portal booking lock)
- `20260422201000_kiosk_anon_update_cancellation_reason_bound.sql` (tighter anon `UPDATE` on kiosk `sales` for `cancellation_reason`)
- `20260422210000_products_combo_soft_delete_scheduled_future.sql` (`products.is_deleted`, `combo_deals.is_deleted`, combo read policy, `sales` trigger for future `scheduled_for`)
- `20260425173000_direct_order_number_allocator.sql` (shared direct order allocator `allocate_direct_display_number()` for `M001..M999`, wrappers for legacy RPC names, active direct unique index on `sales.display_number`)

If you see **“Remote migration versions not found in local migrations directory”**, fix history first: **[docs/MIGRATION_HISTORY.md](docs/MIGRATION_HISTORY.md)** (`npm run supabase:repair:remote` then push again).

**Kitchen hours + pause + soft-close:** migrations add `online_settings.offline_until` and `closing_soon_minutes` (see `20260423120000_online_settings_kitchen_pause.sql`), plus RPC **`expire_online_kitchen_pause_if_due`** (`20260423180000_expire_online_kitchen_pause_rpc.sql`) so timed pauses auto-open in the DB. Customer and edge validation share **[docs/KITCHEN_HOURS.md](docs/KITCHEN_HOURS.md)**. After changing **`online-order-create`** or **`supabase/functions/_shared/kitchenAcceptance.ts`**, redeploy **`online-order-create`** (same command as below).

### Edge Functions (deploy each)

**Supabase MCP project ref (Cursor):** the hosted MCP URL must use the **same** project as `VITE_SUPABASE_URL`. A stale `project_ref` (e.g. a paused/deleted project) shows as **MCP server errored** with no tools.

1. Check local ref: `node scripts/get-supabase-ref.mjs`
2. Fix env + Cursor MCP in one step (pass the live ref from Supabase dashboard or production):

   ```bash
   npm run fix:supabase-ref -- dmrvycswdteuhfydchdr
   ```

   This updates `.env`, repo `.mcp.json`, and `%USERPROFILE%\.cursor\mcp.json`.

3. **Cursor → Settings → Tools & MCP → Supabase** — disable/re-enable or restart Cursor, then complete OAuth if prompted.
4. Verify: ask the agent to run MCP `list_tables` or `get_project_url`.

See [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp) for `read_only=true` and `features=` options.

**Cursor Supabase MCP (preferred when the CLI is not logged in):** for **`online-order-create`** only, you can deploy the exact repo bundle without `supabase login`:

1. Regenerate the MCP payload (UTF-8 one-line JSON):

   ```bash
   npm run mcp:bundle:online-order-create
   ```

   **Smaller payload (single `files[]` entry, inlined `_shared` + handler):** use when your MCP UI struggles with the multi-file JSON (~43 KB):

   ```bash
   npm run mcp:bundle:inline:online-order-create
   ```

   That writes `test-results/mcp-deploy-online-order-create-inline.json` (also generates `test-results/online-order-create-inline.ts` for review).

2. Open **Cursor → MCP → Supabase** (or the Supabase MCP panel), run **`deploy_edge_function`**, and paste the **entire contents** of `test-results/mcp-deploy-online-order-create.json` **or** `test-results/mcp-deploy-online-order-create-inline.json` as the tool **`arguments`** object (it already includes `name`, `entrypoint_path`: `functions/online-order-create/index.ts`, `verify_jwt`: `false`, and `files`).

3. Confirm with **`get_edge_function`** (`function_slug`: `online-order-create`): the active version should increment and the bundled `index.ts` must include real logic (e.g. `roundMoney`, `kitchenAcceptance`, `expire_online_kitchen_pause_if_due`) — **not** a stub like `mcp-deploy-test`.

Agent automation cannot reliably pass multi‑tens‑of‑KB JSON into MCP from chat alone; use the steps above or the CLI below.

```bash
supabase functions deploy online-order-create
supabase functions deploy united-payment-create-payment
supabase functions deploy united-payment-return
supabase functions deploy united-payment-webhook
supabase functions deploy united-payment-status-check
supabase functions deploy epoint-create-payment
supabase functions deploy epoint-webhook
supabase functions deploy payment-reconcile
supabase functions deploy wolt-drive-check
supabase functions deploy wolt-drive-create
supabase functions deploy wolt-drive-cancel
supabase functions deploy wolt-drive-webhook
supabase functions deploy wolt-drive-manual-dispatch
supabase functions deploy wolt-dispatch-book-lock
supabase functions deploy user-management
supabase functions deploy admin-api
supabase functions deploy admin-payment-recheck
supabase functions deploy agent-ops
supabase functions deploy kds-order-status-update
supabase functions deploy pos-order-create
supabase functions deploy kiosk-order-create
```

**Direct order security (sandbox first):** apply **`20260712143000_add_atomic_direct_order_persist.sql`**, then redeploy Edge Functions and ship frontend:

```bash
npm run supabase:push
npm run supabase:deploy:admin-api
npm run supabase:deploy:order
npm run supabase:deploy:kiosk-order
```

Run **`node scripts/staging-rls-check.mjs`** on the target project. Only after online + kiosk QA pass, apply **`20260712144500_harden_direct_order_rls.sql`** as a **separate** release (kiosk direct PostgREST writes will break if this runs before **`kiosk-order-create`** is live).

**Local preview against sandbox** (test project `glpdpkozvmfzgoewquxi`): switching project ref requires **URL + anon key + rebuild** — otherwise staff login shows **Invalid API key**.

```bash
# 1) Point env + MCP at sandbox (pass anon JWT from Dashboard → Settings → API)
node scripts/fix-supabase-project-ref.mjs glpdpkozvmfzgoewquxi --anon-key "<sandbox_anon_jwt>"

# Or URL only, then sync key separately:
node scripts/fix-supabase-project-ref.mjs glpdpkozvmfzgoewquxi
node scripts/sync-supabase-anon-key.mjs "<sandbox_anon_jwt>"

# 2) Rebuild (Vite bakes VITE_* at build time)
npm run deploy:local && npm run deploy:local:storefront

# 3) Optional smoke test
node scripts/test-auth-anon-key.mjs
```

Restore production when done: `node scripts/fix-supabase-project-ref.mjs dmrvycswdteuhfydchdr --anon-key "<production_anon_jwt>"` then rebuild previews.

**POS (`pos.mings.az`):** apply migration **`20260620120000_pos_order_sources.sql`** (extends `M###` pool + KDS anon policies for `pos_*` sources), then deploy **`pos-order-create`**:

```bash
npm run supabase:push
npm run supabase:deploy:pos-order
```

Add **`pos.mings.az`** to the **staff** Vercel project domains (same `dist-staff/` as `sp.mings.az`). Set `VITE_SURFACE_POS_HOSTS=pos.mings.az`. Add `https://pos.mings.az` to Supabase Auth redirect URLs.

**Local label printing:** run **`apps/pos-print-agent`** on the counter Windows PC (`npm start` in that folder; default `http://127.0.0.1:9310`). Optional Electron shell: **`apps/pos-desktop`** (`npm run dist` for `.exe` installer). See each app's `README.md`.

**Staff security layer:** after migration `20260610120000_harden_staff_only_rls.sql`, cockpit **mutations** go through **`admin-api`** (audited service-role writes). KDS status buttons call **`kds-order-status-update`** and **`kds-item-prep-toggle`** with the **staff session JWT** (`requireStaffAuth`). Deploy:

```bash
npm run supabase:deploy:admin-api
npm run supabase:deploy:kds-status
npm run supabase:deploy:kds-item-prep
```

**KDS Chowbus board (2026-06):** three-column kanban, item prep checkoffs, filters/search, undo toast, history drawer. Apply migrations **`20260619120000_kds_item_prep_and_anon_update.sql`** and **`20260619130000_kds_anon_read_completed_today.sql`**, then deploy **`kds-item-prep-toggle`** (item checkoffs) alongside **`kds-order-status-update`** (resets `prepared_at` when starting prep).

**Numbering rollout dependency:** deploy the `20260425173000_direct_order_number_allocator.sql` migration before deploying storefront/kiosk builds that call `allocate_direct_display_number()`. The migration keeps compatibility wrappers (`generate_daily_order_number*`) for staggered rollout safety, but direct callers should move to the shared allocator RPC.

**Browser CORS fix:** [`supabase/config.toml`](supabase/config.toml) sets `verify_jwt = false` for `online-order-create` and `epoint-create-payment`. Deploy those after linking:

```bash
npm run supabase:deploy:web
```

**No Docker Desktop?** `npm run supabase:deploy:*` scripts pass **`--use-api`** so the Supabase CLI bundles on their servers instead of locally. If you run raw `supabase functions deploy`, add `--use-api` yourself (otherwise Docker is required).

**Schema + both functions in one go (after `supabase login` + `supabase link`):**

```bash
npm run supabase:sync
```

### Secrets (Dashboard → Edge Functions → Secrets)

Set at least: `APP_BASE_URL` (your live site URL). Add United Payment / E-point / Wolt secrets when you enable them — see `.env.example` and **[docs/UNITED_PAYMENT_INTEGRATION.md](docs/UNITED_PAYMENT_INTEGRATION.md)**.

**Hermes / agent ops (`agent-ops`):** set `AGENT_API_KEY`, `AGENT_CAPABILITIES` (recommended: `sales_read,analytics_read,expenses_read,expenses_write` — leave `expenses_delete` off), and only set `AGENT_MUTATIONS_ENABLED=true` when you want writes. Deploy with `npm run supabase:deploy:agent-ops`. Hermes connects via [`mcp/mings-ops`](mcp/mings-ops) — see **[docs/HERMES_OPS_MCP.md](docs/HERMES_OPS_MCP.md)**. Do not put the service role key in Hermes.

**KDS auth:** `/kds` uses staff Supabase login. Deploy **`admin-api`**, **`kds-order-status-update`**, and **`kds-item-prep-toggle`** after migrations `20260610120000_harden_staff_only_rls.sql`, `20260619120000_kds_item_prep_and_anon_update.sql`, and `20260621120000_kds_staff_auth_drop_anon_policies.sql`.

### Storefront ↔ KDS (split deploy smoke test)

After **`20260618140000_kds_anon_read_kitchen_queue.sql`** and redeploying `online-order-create` + `kds-order-status-update`:

1. Confirm **both** Vercel projects use the same Supabase URL/anon key.
2. `order.mings.az` — place a **cash takeaway** test order → ticket on `sp.mings.az/kds?key=…` within ~5s.
3. Place a **card** test order → ticket visible on KDS but **Start preparing** blocked until `payment_status = paid`.
4. Pause kitchen in Order Manager → new storefront orders return **`KITCHEN_CLOSED`** (localized error).

Apply migration before relying on online orders on KDS: `npm run supabase:push`.

### United Payment (card payments on `/order` — current provider)

New card orders use **United Payment** hosted checkout. See **[docs/UNITED_PAYMENT_INTEGRATION.md](docs/UNITED_PAYMENT_INTEGRATION.md)**.

1. Edge Function secrets: `UNITED_PAYMENT_API_BASE` (test: `https://test-vpos.unitedpayment.az/api`), `UNITED_PAYMENT_EMAIL`, `UNITED_PAYMENT_PASSWORD`, `APP_BASE_URL`, `UNITED_PAYMENT_FUNCTIONS_PUBLIC_URL`, optional `UNITED_PAYMENT_WEBHOOK_URL`.
2. Deploy: `united-payment-create-payment`, `united-payment-return`, `united-payment-webhook`, `united-payment-status-check` (all `verify_jwt = false` in [`supabase/config.toml`](supabase/config.toml)).
3. Webhooks are unsigned; functions **re-confirm status** via CheckStatus before marking orders paid.
4. Ask United Payment to enable webhook delivery to your `UNITED_PAYMENT_WEBHOOK_URL` when going live.

### Epoint (legacy card payments on `/order`)

1. Run migrations (`npm run supabase:push`) so `online_payments` and `saved_cards` exist with Epoint columns. New hosts also get **`payment_reconciliation_log`** (empty until a future reconciler writes rows; EPoint webhook behavior unchanged).
2. Edge Function secrets:
   - **`EPOINT_PUBLIC_KEY`**, **`EPOINT_PRIVATE_KEY`** — from epoint.az (sandbox first).
   - **`APP_BASE_URL`** — canonical **online order** site origin (must match where customers return after pay; used for Epoint success/error return URLs).
   - Optional **`APP_STOREFRONT_PATH`** — default `/order`. Set to **`/`** when `APP_BASE_URL` is an order **subdomain** and the menu loads at `/` (not `/order`).
   - Optional **`EPOINT_API_BASE`** if Epoint gives a different API base.
3. In the **Epoint merchant dashboard**, set the **result / callback URL** to your deployed webhook:
   - `https://<project-ref>.supabase.co/functions/v1/epoint-webhook`
4. Deploy: `supabase functions deploy epoint-create-payment` and `supabase functions deploy epoint-webhook` (see [`supabase/config.toml`](supabase/config.toml): both skip JWT; webhook verifies `data` + `signature` with the private key).
5. **`EPOINT_WEBHOOK_SECRET`** — only for legacy internal tests (JSON body + `X-Epoint-Signature` HMAC-SHA256). Production Epoint uses **SHA1 signature on `data`**; the private key must match the merchant account.

### Manual payment reconcile (`payment-reconcile`)

Ops-only Edge Function to **read** EPoint `/get-status` and align `online_payments` / `sales` with the shared apply helper. It does **not** create new charges or refunds — it only updates local rows to match the provider (same semantics as a late webhook).

**Cockpit UI:** Staff cockpit → **Payments** (`/spec-ops?screen=payments`) lists `online_payments` and exposes **Re-check status with provider** for **admin/manager**. The browser calls **`admin-payment-recheck`** (staff JWT); that function invokes `payment-reconcile` or `united-payment-status-check` with `PAYMENT_RECONCILE_SECRET` and writes `admin_audit_log`.

**Supplier ledger & cash/debt:** After migration `20260626150000_supplier_ledger_liabilities_bank_withdrawals.sql`, supplier opening balances and lump-sum payments live on **`?screen=suppliers`**; loans/other debt and bank withdrawal fees on **`?screen=liabilities`**. Redeploy **`admin-api`** so mutations on `supplier_account_payments`, `liabilities`, `liability_payments`, and `bank_withdrawals` are allowed.

**Withdrawal fee settings:** After migration `20260714150000_finance_withdrawal_fee_settings.sql`, bank/card cash-out commission rates are editable on **Settings** (admin only). Redeploy **`admin-api`** so updates to `finance_withdrawal_fee_settings` are allowed. Fees stay snapshotted on each withdrawal — changing settings does not rewrite history. See **[docs/TAXES_PAYROLL.md](docs/TAXES_PAYROLL.md)**.

**Payroll:** After migration `20260627120000_taxes_and_payroll.sql`, staff roster and salary payments live on **`?screen=staff`** (Finance hub → **Payroll**). The Taxes screen was removed 2026-06-29 — track tax as operational expenses. Additive migration **`20260801120000_employee_attendance_marks.sql`** adds `employees.weekly_off_weekday` and `employee_day_marks` for month absences (no destructive changes). Redeploy **`admin-api`** so mutations on `employees`, `salary_payments`, and `employee_day_marks` are allowed. See **[docs/TAXES_PAYROLL.md](docs/TAXES_PAYROLL.md)**.

**Task Master:** After migration **`20260804120000_ops_tasks.sql`**, internal ops kanban is at **`/spec-ops?screen=task-master`** (Overview nav). Table **`ops_tasks`**: Backlog → To Do → In Progress → Done; priority none/low/medium/high; assignee from **employees**; date-only deadline; archive + soft delete. Optimistic status updates via **`admin-api`** (no full-page reload). Redeploy **`admin-api`** so mutations on `ops_tasks` are allowlisted. Apply migration to target Supabase (sandbox/prod) before relying on the UI.

**Admin mutation idempotency (money safety):** After migration **`20260804151700_admin_mutation_idempotency.sql`**, money inserts (`supplier_account_payments`, `liability_payments`, `bank_withdrawals`, `cash_movements`, `account_transfers`, `salary_payments`) require a client UUID `idempotency_key`. The edge injects it as unique `client_request_id` and replays prior successes so a flaky `Failed to fetch` cannot double-write. Table **`admin_mutation_idempotency`** is service-role only. Apply the migration, then **`npm run supabase:deploy:admin-api`**, then ship the staff frontend.
**Finance 3-decimal amounts + COGS discount:** After migrations **`20260712150000_finance_amounts_three_decimals.sql`** and **`20260712151000_purchases_discount_percent.sql`**, cockpit finance inputs accept three decimal places (e.g. 1.255 ₼) and COGS purchases can record vendor **`discount_percent`** (default **0%** in UI; preset chips include 2/4/6% when needed). Run `npm run supabase:push` before shipping the frontend build that sends `discount_percent` on purchase inserts.

**Language preference:** After migration **`20260712152000_user_preferences_per_user.sql`**, Settings language choice persists per auth user (`user_preferences.user_id` + RLS). The frontend also keeps **`app_language`** in `localStorage` as the device source of truth.

### Production rollout — `few-fixes-to-spec-ops` (2026-07-12)

Production Supabase project ref: **`dmrvycswdteuhfydchdr`**. Sandbox QA used **`glpdpkozvmfzgoewquxi`**.

**Phase A — spec-ops (ship with this branch):**

1. **Link CLI to production** (if `.env` / MCP still point at sandbox):
   ```powershell
   node scripts/fix-supabase-project-ref.mjs dmrvycswdteuhfydchdr --anon-key "<production_anon_jwt>"
   supabase link --project-ref dmrvycswdteuhfydchdr
   ```
2. **Push DB migrations** (order matters; all idempotent):
   - `20260712150000_finance_amounts_three_decimals.sql`
   - `20260712151000_purchases_discount_percent.sql`
   - `20260712152000_user_preferences_per_user.sql`
   ```bash
   npm run supabase:push
   ```
   If push fails (history skew, TCP timeout on 5432), use **[docs/MIGRATION_HISTORY.md](docs/MIGRATION_HISTORY.md)** (Dashboard SQL or pooler URL).
3. **Merge PR → deploy staff frontend** (`mings-staff` / `dist-staff` on `sp.mings.az`). No edge-function redeploy required for Phase A.
4. **Smoke:** Settings language AZ/RU survives refresh; Expenses accepts 1.255 ₼; COGS discount defaults 0%; Loans CRUD on Liabilities; Payroll table on Staff.

**Phase B — direct orders (separate release; do not combine with Phase A until QA passes):**

1. `20260712143000_add_atomic_direct_order_persist.sql`
2. Deploy **`online-order-create`** and **`kiosk-order-create`**; ship kiosk `CheckoutScreen` + storefront changes.
3. QA kiosk + online checkout on staging.
4. Only then: **`20260712144500_harden_direct_order_rls.sql`** (drops direct client inserts).

1. Set **`PAYMENT_RECONCILE_SECRET`** (strong random string) in Edge secrets.
2. Deploy: `supabase functions deploy payment-reconcile` and `supabase functions deploy admin-payment-recheck` (see [`supabase/config.toml`](supabase/config.toml): `verify_jwt = false`; direct reconcile auth is **`Authorization: Bearer <PAYMENT_RECONCILE_SECRET>`**; cockpit bridge validates staff JWT inside the function).
3. Body: **exactly one** of `{ "sale_id": "<uuid>" }` or `{ "online_payment_id": "<uuid>" }`. For `sale_id`, the function picks `sales.online_payment_id` when it matches the latest `online_payments` row for that sale; otherwise it always uses the **latest** `online_payments` row (`created_at` desc, `id` desc) so an older attempt is never reconciled when a newer one exists.
4. Every attributed run writes **`payment_reconciliation_log`** (including noops and provider errors).

**Example `curl` (replace project ref, secret, and UUIDs):**

```bash
# Wrong secret → 401 AUTH_INVALID
curl -sS -X POST "https://<project-ref>.supabase.co/functions/v1/payment-reconcile" \
  -H "Authorization: Bearer wrong" \
  -H "Content-Type: application/json" \
  -d "{\"sale_id\":\"00000000-0000-0000-0000-000000000001\"}"

# Bad id → 404 NOT_FOUND (after migrate so table exists)
curl -sS -X POST "https://<project-ref>.supabase.co/functions/v1/payment-reconcile" \
  -H "Authorization: Bearer $PAYMENT_RECONCILE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"sale_id\":\"00000000-0000-0000-0000-000000000001\"}"

# Already success (EPoint agrees) → 200 noop + log_id
curl -sS -X POST "https://<project-ref>.supabase.co/functions/v1/payment-reconcile" \
  -H "Authorization: Bearer $PAYMENT_RECONCILE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"online_payment_id\":\"<paid-online-payment-uuid>\"}"

# Pending row where EPoint reports success → 200 applied_success + log_id (local DB catch-up)
curl -sS -X POST "https://<project-ref>.supabase.co/functions/v1/payment-reconcile" \
  -H "Authorization: Bearer $PAYMENT_RECONCILE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"sale_id\":\"<sale-uuid>\"}"
```

**Sandbox checklist (after keys are set):**

- [ ] Place online order with **Card (E-point)** → redirect to Epoint hosted page.
- [ ] Complete test payment → return URL `?paid=1` → banner “Payment received”.
- [ ] Confirm `online_payments.status` = `success` and `sales.payment_status` = `paid` in Supabase Table Editor.
- [ ] Decline / cancel path → `?payment_error=1` if Epoint redirects with your error URL.

---

## 3. Smoke test after deploy

1. Open `https://YOUR_DOMAIN/order` — menu loads.
2. Place a test order (takeaway + COD).
3. Admin → Kiosk orders — order appears with online source.
4. `/track?token=...` from the success screen.

---

## Troubleshooting: CORS / “Failed to fetch” on `/order` checkout

Browsers send an **OPTIONS** preflight **before** `POST` to Edge Functions. The Supabase gateway can reject that preflight if **`verify_jwt` is enabled** (default), because the preflight often has **no** `Authorization` JWT — so you see *“blocked by CORS”* / *“preflight doesn’t have HTTP ok status”* even though the real issue is **401/403 on OPTIONS**.

**Fix (this repo):** [`supabase/config.toml`](supabase/config.toml) sets `verify_jwt = false` for `online-order-create` and `epoint-create-payment`. **Redeploy** those functions after any config change:

```bash
supabase functions deploy online-order-create
supabase functions deploy epoint-create-payment
```

Also confirm the functions are deployed at all (undeployed URL → **404** on OPTIONS, same browser symptom).
