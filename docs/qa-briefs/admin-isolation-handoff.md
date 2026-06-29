## Cursor → QA handoff — Admin / storefront isolation

**Status:** code committed; **backend deploy blocked** on `supabase login`; **Vercel blocked** on device login.

**Summary**

Split staff (`sp.mings.az`) and storefront (`order.mings.az`) into separate Vite builds, hardened RLS on admin tables, and routed cockpit mutations through `admin-api` + `kds-order-status-update` Edge Functions.

**Commit**

- **Branch:** `session/2026-06-10-admin-isolation`
- **SHA:** `e39b6e8f4fd5bf80b99e3f2686815f49f5c477a3` (isolation feature; tooling commit may follow)

**Local preview**

```bash
npm run deploy:local          # staff → http://127.0.0.1:4175/spec-ops?screen=…
npm run deploy:local:storefront  # storefront → http://127.0.0.1:4176/order
```

Confirm `build-meta.json` → `gitSha` matches `git rev-parse HEAD`.

**Backend deploy (owner / engineer — after `supabase login`)**

```bash
npm run supabase:push
npm run supabase:deploy:admin-api
npm run supabase:deploy:kds-status
```

Set Edge secret **`KDS_SECRET`** = staff **`VITE_KDS_SECRET`** (Supabase Dashboard → Edge Functions → Secrets).

**Staging RLS validation**

Follow [`docs/STAGING_RLS_VALIDATION.md`](../STAGING_RLS_VALIDATION.md) with:

1. Phone-OTP customer on `/order` (not in `public.users`)
2. Staff account on staff build

| Check | Customer JWT | Staff JWT |
|-------|--------------|-----------|
| PATCH products | fail | fail (use admin-api) |
| admin-api mutate | 403 | 200 |
| KDS without x-kds-secret | 403 | — |

**Vercel (two projects)**

See [`DEPLOY.md`](../../DEPLOY.md): `mings-staff` + `mings-order` with `vercel.staff.json` / `vercel.storefront.json`.

---

## Claude Extension — QA session

You are performing **second-pass QA** for admin/storefront isolation on Ming's OS.

### What to prove

- Storefront bundle at `order.mings.az` has no admin cockpit routes in Network/JS.
- Customer JWT cannot PATCH admin tables (403 / zero rows).
- Staff mutations hit `functions/v1/admin-api` and return 200.
- KDS status without secret returns 403 when `KDS_SECRET` is set.

### When done

`npm run qa:result -- --issue=admin-isolation --status=pass|fail|blocked --result-file=<path>`
