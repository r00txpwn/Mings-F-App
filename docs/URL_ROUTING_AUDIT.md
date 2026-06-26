# URL & path audit (client routes, Edge Functions, logical risks)

Last reviewed: 2026-06-10

## Split builds (staff vs storefront)

Production uses **two static bundles** (see [DEPLOY.md](../DEPLOY.md)):

| Domain | Build | Surfaces in bundle |
|--------|-------|-------------------|
| `order.mings.az` | `dist-storefront/` | `/`, `/order`, `/track` only |
| `sp.mings.az` | `dist-staff/` | cockpit, `/order-manager`, `/kds`, `/kiosk`, `/pos` |
| `pos.mings.az` | `dist-staff/` | `PosApp` at `/` (same artifact as staff) |

Local dev: `npm run dev:staff` (**127.0.0.1:5173**, `/spec-ops`) or `npm run dev:storefront` (**127.0.0.1:5174**, `/order`). Local preview: `npm run deploy:local` (**4175**) / `deploy:local:storefront` (**4176**). Each command kills the fixed port first; no auto-fallback. Auth storage keys differ (`mings-staff-auth` vs `mings-storefront-auth`).

## 1. SPA entry (`src/main-staff.tsx` / `src/main-storefront.tsx`)

Hostname is checked first via [`resolveHostedSurface`](src/lib/surfaceHost.ts) (`VITE_SURFACE_*_HOSTS`). When a host matches, the app shell loads at `/` (and `/track` on order hosts still opens tracking).

| Host match (env) | Path | App |
|------------------|------|-----|
| `VITE_SURFACE_ADMIN_HOSTS` | `/kiosk` or `/kds` | `KioskApp` / `KitchenDisplay` (path wins over admin host) |
| `VITE_SURFACE_ADMIN_HOSTS` | other | `App` (cockpit) |
| `VITE_SURFACE_ORDER_HOSTS` | `/order-manager` or `/order-management` | `OrderManagerApp` |
| `VITE_SURFACE_ORDER_HOSTS` | not `/track` and not order-manager paths | `OrderApp` |
| `VITE_SURFACE_ORDER_HOSTS` | `/track` | `TrackingApp` |
| `VITE_SURFACE_KIOSK_HOSTS` | any | `KioskApp` |
| `VITE_SURFACE_KDS_HOSTS` | any | `KitchenDisplay` |
| `VITE_SURFACE_POS_HOSTS` | any | `PosApp` |
| `VITE_SURFACE_TRACK_HOSTS` | any | `TrackingApp` |

**Path fallback** (no host match — localhost, `*.vercel.app`, etc.):

| Normalized path | App | Notes |
|-----------------|-----|--------|
| `/` | `PublicNotFound` | Admin-denied root surface; no redirect to `/order`. |
| `/kiosk` | `KioskApp` | Uses `pathNorm` (trailing slash OK). |
| `/kds` | `KitchenDisplay` | Uses `pathNorm` (trailing slash OK). |
| `/pos` | `PosApp` | Counter/phone POS (auth-gated). Tabs: Active, History, New Order, Settings. |
| `/order` | `OrderApp` | Public ordering. |
| `/order-manager` | `OrderManagerApp` | Staff workflow (auth-gated). Top of main: **Kitchen status** strip (pause 30m / 1h / until next open / indefinite + Open now) updating `online_settings`. Bottom nav: Active + Past for every staff user; **Menu Editor** tab only when `public.users.role` is `admin` or `manager` (hidden for `staff`). The shell re-reads `users.role` after auth so the tab list matches the same Supabase row QA inspects on `/rest/v1/users`. |
| `/order-management` | `OrderManagerApp` | Alias to `/order-manager`. Same tab rules as `/order-manager`. |
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
| `App.tsx` | On the **admin host** or at **`/spec-ops`** (default local admin path), `?screen=` selects cockpit screens. Sidebar nav is grouped (Overview / Orders / Catalog / Finance / System) and collapsible; default `?screen=home` is the executive dashboard. Finance includes **`?screen=payments`** (online payment list + provider re-check) and **`?screen=liabilities`** (loans/other debt + bank withdrawal log). Supplier account balances (opening balance, lump-sum pay, FIFO) live on **`?screen=suppliers`**. | **Local QA URL:** `http://127.0.0.1:4175/spec-ops?screen=home` — not root `/?screen=…` (see `getResolvedAdminPath()`). Payments: `http://127.0.0.1:4175/spec-ops?screen=payments`. Cash & debt: `http://127.0.0.1:4175/spec-ops?screen=liabilities`. |
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
| `user-management` | `UsersScreen` GET `…/user-management/list`, POST `…/create`, DELETE `…/delete/:id`, PUT `…/update-role`, PUT `…/reset-password` | Bearer: staff session JWT. **Admin-only** (role `admin` in `public.users` or JWT claim). |
| `admin-payment-recheck` | `PaymentsScreen` POST via `recheckPayment()` (`src/lib/adminApi.ts`) | Bearer: staff session JWT. **Admin/manager only**; routes to `payment-reconcile` or `united-payment-status-check` using `PAYMENT_RECONCILE_SECRET` server-side. Writes `admin_audit_log`. |
| `epoint-webhook` | Server-to-server (E-point) | Not a browser route. |
| `wolt-drive-*` | Backend / integrations | Not audited as SPA paths. |

### `user-management` path parsing

Uses suffix after `/user-management` in `req.url` so both deployed URL shapes work (e.g. `…/functions/v1/user-management/list`).

Token validation uses a user-scoped Supabase client (`SUPABASE_ANON_KEY` + `Authorization: Bearer <jwt>`) and `supabaseUser.auth.getUser()`, which supports ES256 JWTs.

### Logical risks

- **Managers** cannot call `user-management` (admin-only). If product needs “manager invites staff”, policy must change.
- **Create user** must insert `public.users` after Auth create; rollback on failure (implemented in Edge Function).

---

## 4. Kiosk / KDS gates (`SecretGate.tsx`)

- If `VITE_KIOSK_SECRET` is **empty**, kiosk gate **allows** access (documented for local dev).
- **`/kds`** uses **staff Supabase Auth** (login screen) — not `SecretGate` or URL secrets.
- **Production kiosk**: set `VITE_KIOSK_SECRET` and use `?key=` (or accept open kiosk — business risk).

### Kiosk UX (in-store, `/kiosk`)

- **Light Ming theme** (cream `#f5f0e8`, coral `#d65745`): scoped via `.kiosk-light` on `KioskLayout` — staff cockpit dark mode is unaffected.
- **Flow:** `idle` (Eat In / Take Out) → `categories` (photo grid) → `menu` (horizontal category rail + 3-col product grid) → `cart` → `checkout` → `confirmation`.
- **Sticky footer** on categories + menu: Restart Menu, live total, Order Now (`KioskStickyFooter`).
- **i18n:** `kioskWelcomeTitle`, `kioskEatIn`, `kioskTakeOut`, `kioskExploreMenu`, etc. in `src/translations.ts`.
- **E2E:** `tests/e2e/kiosk-smoke.spec.ts` (Playwright project `kiosk`, staff preview port 4175).

### KDS data access (staff auth)

- **`/kds`** on `sp.mings.az` requires **staff Supabase login** (same as `/pos` and `/order-manager`). Uses the staff auth session (`mings-staff-auth`) and `Staff can read all sales` RLS — not the anon role.
- **`/pos`** and **`pos.mings.az`** use staff auth. New orders call Edge Function **`pos-order-create`**; labels print via local **`apps/pos-print-agent`** (HTTP on port 9310, LAN only).
- Migration **`20260621120000_kds_staff_auth_drop_anon_policies.sql`** removes anon kitchen-queue read/write policies (previously added for unauthenticated KDS).
- **Chowbus-style board** (`src/kds/`): `KitchenDisplay` → `KdsHeader` (filters/search) → `KdsBoard` → `KdsColumn` + `KdsOrderCard` + `KdsLineItem`; `KdsUndoToast`, `KdsHistoryDrawer`; pure logic in `kdsBoardUtils.ts`.
- Status updates: **`kds-order-status-update`** (staff JWT via `requireStaffAuth`). Item prep toggles: **`kds-item-prep-toggle`**. Unpaid **card** orders are rejected server-side when moving to `preparing`.
- Migrations **`20260619120000_kds_item_prep_and_anon_update.sql`** (`sale_items.prepared_at`) and **`20260619130000_kds_anon_read_completed_today.sql`** (history drawer; reads now via staff RLS).
- **Split deploy:** both Vercel projects must use the **same** `VITE_SUPABASE_URL` / anon key. **`VITE_KDS_SECRET` is no longer used** — remove from env after deploy.

---

## 5. Consistency checklist (done)

- [x] `/kds` and `/kds/` both resolve to KDS (`pathNorm`).
- [x] `/kiosk` and `/kiosk/` both resolve to kiosk (`pathNorm`).
- [x] Reserved paths in `adminPath.ts` don’t collide with public routes.

---

## 6. Recommended follow-ups (not implemented)

1. **Optional React Router** for future: query params, nested admin routes, `basename` for subfolder deploys.
2. **`robots.txt`**: optionally disallow `/` redirect target patterns if SEO matters (usually N/A for apps behind login).
3. **E2E tests**: smoke tests for `/order`, admin path, `/kiosk`, `/kds`, `/pos` — see `tests/e2e/kds-smoke.spec.ts`, `tests/e2e/kiosk-smoke.spec.ts`, and `tests/e2e/pos-smoke.spec.ts` (local staff preview on port 4175).

---

## 7. Expected browser history behavior

- Navigating directly to `/spec-ops` and using in-app tabs (e.g. Money) should keep browser history within admin pages.
- Pressing browser back from admin pages should not trigger any root redirect to `/order`.
- `/order` remains explicitly reachable only via direct path entry (`/order`) or intentional links.
