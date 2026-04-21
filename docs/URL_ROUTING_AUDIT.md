# URL & path audit (client routes, Edge Functions, logical risks)

Last reviewed: 2026-03-26

## 1. SPA entry (`src/main.tsx`)

Hostname is checked first via [`resolveHostedSurface`](src/lib/surfaceHost.ts) (`VITE_SURFACE_*_HOSTS`). When a host matches, the app shell loads at `/` (and `/track` on order hosts still opens tracking).

| Host match (env) | Path | App |
|------------------|------|-----|
| `VITE_SURFACE_ADMIN_HOSTS` | any | `App` (cockpit) |
| `VITE_SURFACE_ORDER_HOSTS` | not `/track` | `OrderApp` |
| `VITE_SURFACE_ORDER_HOSTS` | `/track` | `TrackingApp` |
| `VITE_SURFACE_KIOSK_HOSTS` | any | `KioskApp` |
| `VITE_SURFACE_KDS_HOSTS` | any | `KitchenDisplay` |
| `VITE_SURFACE_TRACK_HOSTS` | any | `TrackingApp` |

**Path fallback** (no host match — localhost, `*.vercel.app`, etc.):

| Normalized path | App | Notes |
|-----------------|-----|--------|
| `/` | `PublicNotFound` | Admin-denied root surface; no redirect to `/order`. |
| `/kiosk` | `KioskApp` | Uses `pathNorm` (trailing slash OK). |
| `/kds` | `KitchenDisplay` | Uses `pathNorm` (fixed: was `pathname`, so `/kds/` was broken). |
| `/order` | `OrderApp` | Public ordering. |
| `/track` | `TrackingApp` | Query `?token=` for status. |
| `/spec-ops` | `App` (cockpit) | Default admin URL. Optional `VITE_ADMIN_APP_PATH` overrides. |
| **Anything else** | `PublicNotFound` | No hints about admin URL. |

### Logical notes

- **Case**: Paths are case-sensitive (`/Order` ≠ `/order`) → 404. Acceptable for static hosting.
- **Subpath deployment**: Path-based links use `/order`, `/kiosk`. Staff “open storefront” uses [`getPublicOrderUrl`](src/lib/surfaceHost.ts) / `VITE_PUBLIC_ORDER_URL` when set. A Vite **`base`** other than `/` is **not** supported without refactoring links and router.
- **Admin path**: Default `/spec-ops` is fixed in client code; override env is inlined if set — rely on Auth + RLS + passwords.

---

## 2. In-app navigation & redirects

| Location | Behavior | Risk / note |
|----------|----------|-------------|
| `App.tsx` | Non-staff logged-in users → `StaffAccessDeniedScreen` (no auto-redirect to `/order`). | OK. |
| `OrderApp.tsx` | E-point success → external `checkoutUrl`. Done screen → `/track?token=`. | External URL must be trusted (payment provider). |
| `PublicNotFound.tsx` | Denied/404 messaging for root + unknown paths. | No storefront auto-redirect from `/` or invalid paths. |
| `StaffAccessDeniedScreen.tsx` | Link via `getPublicOrderUrl()` (`VITE_PUBLIC_ORDER_URL` or same-origin `/order`). | OK. |
| `KioskOrdersScreen.tsx` | `getPublicOrderUrl()`, `getPublicKioskEntryUrl()` | Kiosk URL uses `VITE_PUBLIC_KIOSK_URL` or same-origin `/kiosk`; `?key=` when `VITE_KIOSK_SECRET` is set. |

---

## 3. Edge Functions (HTTP)

Invoked from the browser (or webhooks):

| Function | Client usage | Auth |
|----------|----------------|------|
| `online-order-create` | `invokeEdgeFunction` POST (`OrderApp`) | Bearer: user JWT or anon key. |
| `epoint-create-payment` | `invokeEdgeFunction` POST (`OrderApp`) | Same. |
| `user-management` | `UsersScreen` GET `…/user-management/list`, POST `…/create`, DELETE `…/delete/:id` | Bearer: staff session JWT. **Admin-only** (role `admin` in `public.users` or JWT claim). |
| `epoint-webhook` | Server-to-server (E-point) | Not a browser route. |
| `wolt-drive-*` | Backend / integrations | Not audited as SPA paths. |

### `user-management` path parsing

Uses suffix after `/user-management` in `req.url` so both deployed URL shapes work (e.g. `…/functions/v1/user-management/list`).

### Logical risks

- **Managers** cannot call `user-management` (admin-only). If product needs “manager invites staff”, policy must change.
- **Create user** must insert `public.users` after Auth create; rollback on failure (implemented in Edge Function).

---

## 4. Kiosk / KDS gates (`SecretGate.tsx`)

- If `VITE_KIOSK_SECRET` / `VITE_KDS_SECRET` is **empty**, gate **allows** access (documented for local dev).
- **Production**: set secrets and always use `?key=` (or accept open kiosk — business risk).

---

## 5. Consistency checklist (done)

- [x] `/kds` and `/kds/` both resolve to KDS (`pathNorm`).
- [x] `/kiosk` and `/kiosk/` both resolve to kiosk (`pathNorm`).
- [x] Reserved paths in `adminPath.ts` don’t collide with public routes.

---

## 6. Recommended follow-ups (not implemented)

1. **Optional React Router** for future: query params, nested admin routes, `basename` for subfolder deploys.
2. **`robots.txt`**: optionally disallow `/` redirect target patterns if SEO matters (usually N/A for apps behind login).
3. **E2E tests**: smoke tests for `/order`, admin path, `/kiosk`, `/kds`.

---

## 7. Expected browser history behavior

- Navigating directly to `/spec-ops` and using in-app tabs (e.g. Money) should keep browser history within admin pages.
- Pressing browser back from admin pages should not trigger any root redirect to `/order`.
- `/order` remains explicitly reachable only via direct path entry (`/order`) or intentional links.
