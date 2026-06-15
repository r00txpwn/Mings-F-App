# Production readiness report — 2026-06-10

**Branch:** `session/2026-06-10-admin-isolation`  
**Commit:** `3742d5f7d2df0084b7342e862388cb535490d070` (+ uncommitted E2E split + scripts)

## Executive summary

| Area | Status | Notes |
|------|--------|-------|
| Split Vite builds (staff / storefront) | **Pass** | `build:all` succeeds |
| Vercel production deploy | **Pass** | `sp.mings.az` → staff, `order.mings.az` → storefront |
| Google Maps referrers | **Pass** | Production key accepts order + preview hosts |
| CI checks (typecheck, lint, unit) | **Pass** | 54 unit tests, 0 TS errors, 12 pre-existing lint warnings |
| Playwright E2E (local split preview) | **Pass** | 11/11 after split spec + browser install |
| Production browser smoke | **Pass** | Menu loads, track page, staff login gate |
| Supabase migration + Edge Functions | **Blocked** | Local `.env` points to dead project ref |
| RLS staging validation | **Blocked** | Depends on live Supabase + `STAFF_PASSWORD` |
| KDS_SECRET sync | **Pending** | Not set in `.env` or Supabase secrets |

**Verdict:** Frontend isolation and hosting are production-ready. **Backend security layer (RLS migration, admin-api, kds-order-status-update) is not yet applied** because the Supabase CLI cannot reach the project configured in local `.env`.

---

## Critical blocker: Supabase project mismatch

| Source | Project ref | DNS |
|--------|-------------|-----|
| Local `.env` (`VITE_SUPABASE_URL`) | ~~`ofautxfwbjhyruyppqth`~~ → **`dmrvycswdteuhfydchdr`** (fixed) | Was NXDOMAIN; now matches production |
| Live production (browser network on order.mings.az) | `dmrvycswdteuhfydchdr` | **Resolves**, API 200 |

**Action required (owner):**

1. Update `.env` / Vercel env so **local dev and CLI** use the same active project as production (`dmrvycswdteuhfydchdr` or your canonical ref).
2. Run `supabase login` (or set `SUPABASE_ACCESS_TOKEN`).
3. Then:
   ```bash
   npm run supabase:push
   npm run supabase:deploy:admin-api
   npm run supabase:deploy:kds-status
   ```
4. Set Edge secret `KDS_SECRET` = same value as staff `VITE_KDS_SECRET` on Vercel (`mings-f-app`).
5. Add `STAFF_PASSWORD` to `.env` and run `node scripts/staging-rls-check.mjs`.

See `docs/STAGING_RLS_VALIDATION.md` for manual checks.

---

## Verification matrix

### Automated (this session)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (12 warnings, pre-existing) |
| `npm run test` | 54/54 pass |
| `npm run build:all` | Pass |
| `npm run test:e2e` (CI=1, previews 4175+4176) | **11/11 pass** |

### E2E coverage (split builds)

- **Staff** (`http://127.0.0.1:4175`): login shell, bundle integrity, `/order` not served, deep `/spec-ops` SPA rewrite
- **Storefront** (`http://127.0.0.1:4176`): `/`, `/order`, `/track`, bundle integrity, `/spec-ops` blocked

Specs: `tests/e2e/smoke.staff.spec.ts`, `tests/e2e/smoke.storefront.spec.ts`

### Production smoke (browser)

| URL | Result |
|-----|--------|
| https://order.mings.az/ | Menu loads (Noodles, prices, cart) |
| https://order.mings.az/track | “Missing tracking link” (expected without token) |
| https://sp.mings.az/ | Staff login gate (AZ copy) |

Supabase REST calls on production order site: **200** to `dmrvycswdteuhfydchdr.supabase.co`.

### Known UI issue (non-blocking)

Staff login at `sp.mings.az` shows raw key `orderSignInGoogle` on Google button — translation key may be missing in deployed bundle or AZ locale. Verify `src/translations.ts` keys are in the build you deploy.

---

## Vercel (done)

| Domain | Project | Build command | Output |
|--------|---------|---------------|--------|
| sp.mings.az | mings-f-app | `npm run build:staff` | dist-staff |
| order.mings.az | mings-order | `npm run build:storefront` | dist-storefront |

Redeploy both projects after merging session branch so production bundles include latest admin-api client migrations.

---

## Remaining before “fully hardened” production

1. ~~Fix `.env` Supabase URL to active project ref.~~ Done (`dmrvycswdteuhfydchdr`)
2. ~~Apply RLS migration + `admin_audit_log`.~~ Done (`harden_staff_only_rls_no_categories`)
3. ~~Deploy `admin-api` Edge Function.~~ Done (v1 ACTIVE)
4. **Set `STAFF_PASSWORD` in `.env`** and re-run `npm run staging:rls-check` for staff/admin-api checks
5. **Confirm `VITE_KDS_SECRET` (Vercel staff) = `KDS_ORDER_STATUS_SECRET` (Supabase Edge)** — KDS already returns 401 without header
6. ~~Redeploy Vercel staff + storefront with latest code.~~ Done 2026-06-15

---

## Local preview commands

```bash
npm run deploy:local          # staff → http://127.0.0.1:4175/
npm run deploy:local:storefront  # storefront → http://127.0.0.1:4176/
set CI=1 && npm run test:e2e  # both previews must be running
```

First-time Playwright: `npx playwright install chromium`
