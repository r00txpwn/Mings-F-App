# Staging RLS validation (customer vs staff)

Run on **staging Supabase** after applying `20260610120000_harden_staff_only_rls.sql` and deploying `admin-api` + `kds-order-status-update`.

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

- With `KDS_SECRET` set on Edge + staff deploy `VITE_KDS_SECRET`, status button calls `kds-order-status-update` with `x-kds-secret`.
- Without secret header → **403**.

## Record results

| Check | Customer JWT | Staff JWT |
|-------|--------------|-----------|
| PATCH products | fail | fail (use admin-api) |
| admin-api mutate products | 403 | 200 |
| KDS status without secret | 403 | — |
