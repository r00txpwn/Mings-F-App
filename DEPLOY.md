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
   - `VITE_APP_SURFACE` (`order` on `order.mings.az`, `sp` on `sp.mings.az`)
   - Optional: `VITE_ORDER_APP_ORIGIN` (for staff links to customer app), `VITE_ADMIN_APP_PATH` (custom admin entry path, default `/spec-ops`), `VITE_GOOGLE_MAPS_API_KEY` (see Google Maps setup below), `VITE_KIOSK_SECRET`, `VITE_KDS_SECRET`, `VITE_ENABLE_COMBOS`, `VITE_WOLT_PORTAL_URL`

### Delivery zones + online settings (Delivery Control Center)

Zones, kitchen/online settings, and live dispatch are all edited from `/delivery` in the staff cockpit (admin role only). The [`20260420160000_delivery_control_center.sql`](supabase/migrations/20260420160000_delivery_control_center.sql) migration formalises the schema and applies staff-only RLS. After deploying, seed at least one active polygon for your service area — otherwise the customer site will reject every address as "outside delivery area".

### Google Maps setup (required for the customer delivery flow)

The customer order surface uses Google Maps for its address picker. The autocomplete is built on the **Places API (New)** (`AutocompleteSuggestion` / `Place.fetchFields`) and requires a correctly configured key in **Google Cloud Console**:

1. Enable these APIs on the project the key belongs to:
   - **Maps JavaScript API**
   - **Places API (New)** — *not* the legacy "Places API"
   - **Geocoding API** (used for the draggable-pin reverse geocode)
2. Put the key in `VITE_GOOGLE_MAPS_API_KEY` and redeploy.
3. Restrict the key (Cloud Console → Credentials → key → Application restrictions): allow the production origins you deploy to (`https://order.mings.az/*`, `https://sp.mings.az/*`, any preview hosts, and `http://localhost:*` for dev).
4. Make sure **billing is active** on the Cloud project — Places API (New) refuses all requests otherwise.
5. If the key is missing, the address picker falls back to a plain textarea so the app still builds and runs, but delivery zone validation becomes weaker.

Hostnames are also mapped at runtime as a safety net:
- `order.*` always resolves to customer surface
- `sp.*` always resolves to staff surface

`vercel.json` in this repo configures SPA rewrites. It currently includes a temporary legacy redirect:
- `order.mings.az/order` → `/`

If you deploy with a custom `VITE_ADMIN_APP_PATH`, ensure that path is handled by SPA rewrite (`index.html`) and is **not** redirected away.

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

Recent combo-related migrations to ensure are applied:

- `20260418140100_combo_deals.sql`
- `20260418153000_add_products_upsell_combo_id.sql`
- `20260418191000_combo_discount_fields.sql`
- `20260418200000_add_scheduled_orders.sql`

**From this repo (uses `npx`, no global CLI required):**

```bash
npm run supabase:push
```

If you see **“Remote migration versions not found in local migrations directory”**, fix history first: **[docs/MIGRATION_HISTORY.md](docs/MIGRATION_HISTORY.md)** (`npm run supabase:repair:remote` then push again).

### Edge Functions (deploy each)

`online-order-create` loads each product’s modifier groups (`min_select` / `max_select`) and rejects carts that violate those limits (HTTP 400). Redeploy after changing validation logic.

```bash
supabase functions deploy online-order-create
supabase functions deploy epoint-create-payment
supabase functions deploy epoint-webhook
supabase functions deploy wolt-drive-check
supabase functions deploy wolt-drive-create
supabase functions deploy wolt-drive-cancel
supabase functions deploy wolt-drive-webhook
supabase functions deploy user-management
```

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

---

## 3. Smoke test after deploy

1. Open `https://order.mings.az/` — menu loads.
2. Place a test order (takeaway + COD).
3. Open `https://sp.mings.az/` and log in — order appears in Kiosk Orders.
4. `/track?token=...` from the success screen.

---

## Troubleshooting: CORS / “Failed to fetch” on order checkout

Browsers send an **OPTIONS** preflight **before** `POST` to Edge Functions. The Supabase gateway can reject that preflight if **`verify_jwt` is enabled** (default), because the preflight often has **no** `Authorization` JWT — so you see *“blocked by CORS”* / *“preflight doesn’t have HTTP ok status”* even though the real issue is **401/403 on OPTIONS**.

**Fix (this repo):** [`supabase/config.toml`](supabase/config.toml) sets `verify_jwt = false` for `online-order-create` and `epoint-create-payment`. **Redeploy** those functions after any config change:

```bash
supabase functions deploy online-order-create
supabase functions deploy epoint-create-payment
```

Also confirm the functions are deployed at all (undeployed URL → **404** on OPTIONS, same browser symptom).
