# Deploy Mings

## What runs locally (already done)

- `npm run build` → output in `dist/`

## 1. Frontend (static host)

Pick **one** of:

### Vercel

1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. From repo root: `vercel` (first time) then `vercel --prod`
3. In the Vercel project **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional: `VITE_GOOGLE_MAPS_API_KEY` (delivery map on `/order`), `VITE_KIOSK_SECRET`
   - **Production KDS:** set `VITE_KDS_SECRET` to a long random value in **production** env (and staging separately if you gate staging KDS). Leave unset **only** for local dev if you want `/kds` open. After setting or changing it, **redeploy** so the bundle picks it up. Open KDS as `/kds?key=<secret>` (bookmark on kitchen devices). Do not commit the secret.
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

**From this repo (uses `npx`, no global CLI required):**

```bash
npm run supabase:push
```

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
```

**Numbering rollout dependency:** deploy the `20260425173000_direct_order_number_allocator.sql` migration before deploying storefront/kiosk builds that call `allocate_direct_display_number()`. The migration keeps compatibility wrappers (`generate_daily_order_number*`) for staggered rollout safety, but direct callers should move to the shared allocator RPC.

**Browser CORS fix:** [`supabase/config.toml`](supabase/config.toml) sets `verify_jwt = false` for `online-order-create` and `epoint-create-payment`. Deploy those after linking:

```bash
npm run supabase:deploy:web
```

**Schema + both functions in one go (after `supabase login` + `supabase link`):**

```bash
npm run supabase:sync
```

### Secrets (Dashboard → Edge Functions → Secrets)

Set at least: `APP_BASE_URL` (your live site URL). Add E-point / Wolt secrets when you enable them — see `.env.example`.

### Epoint (card payments on `/order`)

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

1. Set **`PAYMENT_RECONCILE_SECRET`** (strong random string) in Edge secrets.
2. Deploy: `supabase functions deploy payment-reconcile` (see [`supabase/config.toml`](supabase/config.toml): `verify_jwt = false`; auth is **`Authorization: Bearer <PAYMENT_RECONCILE_SECRET>`**).
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
