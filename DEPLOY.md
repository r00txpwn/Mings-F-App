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
   - Optional: `VITE_ORDER_APP_ORIGIN` (for staff links to customer app), `VITE_GOOGLE_MAPS_API_KEY`, `VITE_KIOSK_SECRET`, `VITE_KDS_SECRET`

`vercel.json` in this repo configures SPA rewrites. It also includes temporary legacy redirects:
- `order.mings.az/order` → `/`
- `sp.mings.az/spec-ops` → `/`

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

**From this repo (uses `npx`, no global CLI required):**

```bash
npm run supabase:push
```

If you see **“Remote migration versions not found in local migrations directory”**, fix history first: **[docs/MIGRATION_HISTORY.md](docs/MIGRATION_HISTORY.md)** (`npm run supabase:repair:remote` then push again).

### Edge Functions (deploy each)

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
