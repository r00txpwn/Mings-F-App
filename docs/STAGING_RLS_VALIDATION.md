# Staging RLS validation (customer vs staff)

Run on **production/staging Supabase** after applying `20260614170000_harden_staff_only_rls_no_categories.sql` and deploying **`admin-api`**.

Automated partial check (no staff password required for anon + KDS):

```bash
npm run staging:rls-check
```

Set `STAFF_PASSWORD` in `.env` (staff login password) to also verify staff JWT + admin-api paths.

**KDS secret:** production Edge Function uses `KDS_ORDER_STATUS_SECRET` (Supabase Edge secrets). Staff bundle sends `VITE_KDS_SECRET` as `x-kds-secret` — values must match.

## Setup

1. Create or use a **customer** account via phone OTP on `/order` (not in `public.users`).
2. Create a **staff** account on `sp.mings.az` (row in `public.users`).
3. Use Supabase REST or browser devtools with each JWT.

## Customer JWT — must fail (403 / RLS)

Try PostgREST writes with the customer access token:

```http
PATCH /rest/v1/products?id=eq.<any-id>
Authorization: Bearer <customer-jwt>
apikey: <anon-key>
Content-Type: application/json

{"selling_price": 0.01}
```

Repeat for: `suppliers`, `operational_expenses`, `platform_payouts`, `sales_channels`, `master_categories`.

**Expected:** error / zero rows updated.

## Staff JWT — cockpit reads OK; mutations via admin-api

Direct PostgREST **SELECT** on finance tables should work for staff.

Mutations from the staff cockpit should succeed via **`admin-api`** (Network tab: `functions/v1/admin-api` with staff Bearer token).

## KDS

- With `KDS_ORDER_STATUS_SECRET` set on Supabase Edge + staff deploy `VITE_KDS_SECRET` (same value), status button calls `kds-order-status-update` with `x-kds-secret`.
- Without secret header → **401** (`invalid_device_secret`).

## Record results

| Check | Customer JWT | Staff JWT |
|-------|--------------|-----------|
| PATCH products | fail | fail (use admin-api) |
| admin-api mutate products | 403 | 200 |
| KDS status without secret | 403 | — |
