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
| `/order` | `OrderApp` | Public ordering. Honors kitchen hours + **special days** from `online_settings` (Baku). When today has a special-day customer note, shows a dismissible notice modal on load. Checkout blocked when kitchen is paused or outside effective hours. |
| `/order-manager` | `OrderManagerApp` | Staff workflow (auth-gated). Top of main: **Kitchen status** strip (pause 30m / 1h / until next open / indefinite + Open now) updating `online_settings`. Bottom nav: Active + Past for every staff user; **Menu Editor** tab only when `public.users.role` is `admin` or `manager` (hidden for `staff`). The shell re-reads `users.role` after auth so the tab list matches the same Supabase row QA inspects on `/rest/v1/users`. |
| `/order-management` | `OrderManagerApp` | Alias to `/order-manager`. Same tab rules as `/order-manager`. |
| `/track` | `TrackingApp` | Query `?token=` for status. |
| `/spec-ops` | `App` (cockpit) | Default admin URL. Optional `VITE_ADMIN_APP_PATH` overrides. **Administration-only:** `admin` + `manager` enter; `staff`-role users get `AdminAccessDeniedScreen` (links to POS / KDS / Kiosk). See **§ Role-based access**. |
| **Anything else** | `PublicNotFound` | No hints about admin URL. |

### Logical notes

- **Case**: Paths are case-sensitive (`/Order` ≠ `/order`) → 404. Acceptable for static hosting.
- **Subpath deployment**: Path-based links use `/order`, `/kiosk`. Staff “open storefront” uses [`getPublicOrderUrl`](src/lib/surfaceHost.ts) / `VITE_PUBLIC_ORDER_URL` when set. A Vite **`base`** other than `/` is **not** supported without refactoring links and router.
- **Admin path**: Default `/spec-ops` is fixed in client code; override env is inlined if set — rely on Auth + RLS + passwords.

### Role-based access (cockpit vs floor)

`public.users.role` (`admin` | `manager` | `staff`) drives surface access. The cockpit is **administration-only**; `staff` work the floor surfaces.

| Surface | `staff` | `manager` | `admin` |
|---------|:------:|:--------:|:------:|
| Cockpit `/spec-ops` (analytics, finance, catalog, settings) | — | ✓ | ✓ |
| Cockpit → Users | — | — | ✓ |
| POS `/pos` · Kiosk `/kiosk` · KDS `/kds` · Order Manager `/order-manager` | ✓ | ✓ | ✓ |
| Order Manager → Menu Editor tab | — | ✓ | ✓ |

Enforcement layers:

1. **UI surface guard** — `src/App.tsx` renders `AdminAccessDeniedScreen` when `roleMayAccessCockpit(staffRole)` is false (`src/lib/staffRole.ts`). `staffRole` comes from `AuthContext`.
2. **admin-api `TABLE_MIN_ROLE`** — cockpit-only tables require `admin`/`manager`; `staff` is excluded. `sales` is the deliberate exception (Order Manager status updates as `staff`). The Edge Function uses the service role and **bypasses RLS**, so this map is the primary write gate.
3. **RLS defense-in-depth** — migration `20260628120000_restrict_cockpit_writes_to_admin_manager.sql` adds `public.is_admin()` / `public.is_admin_or_manager()` and sets cockpit-only tables to admin/manager INSERT/UPDATE, admin-only DELETE (SELECT unchanged). Excludes `sales`, `sale_item_modifiers`, `online_settings`.

> Manager access is intentionally broad for now and will be refined in a later pass. Per-user granular entitlements are not implemented yet.

### Audit & accountability (admin)

| Store | What it captures | Who can read |
|-------|------------------|--------------|
| `admin_audit_log` | Edge Function mutations (`admin-api`, `user-management`, payment re-check) with actor id/role | **Admin only** |
| `audit_logs` | Row-level INSERT/UPDATE/DELETE triggers on finance/catalog tables | **Admin only** |
| `auth_events` | Staff `login` / `logout` with surface + device type (no IP) | **Admin only** (staff can insert own events on sign-in/out) |

Cockpit viewer: **`?screen=audit-log`** (`AuditLogScreen`, admin-only nav item). Migration: `20260628130000_audit_hardening_and_auth_events.sql`.

---

## 2. In-app navigation & redirects

| Location | Behavior | Risk / note |
|----------|----------|-------------|
| `App.tsx` | Non-staff logged-in users → `StaffAccessDeniedScreen` (no auto-redirect to `/order`). | OK. |
| `App.tsx` | `staff`-role users (have a `public.users` row but role `staff`) → `AdminAccessDeniedScreen` (cockpit is admin/manager-only). Gate via `roleMayAccessCockpit(staffRole)`. | See **§ Role-based access**. |
| `App.tsx` | On the **admin host** or at **`/spec-ops`** (default local admin path), `?screen=` selects cockpit screens. Sidebar nav is grouped (Overview / Orders / Catalog / Finance / System) and collapsible; default `?screen=home` is the executive dashboard. **Overview:** `home`, **`task-master`** (Task Master ops kanban — managers). **Finance sidebar (2026-06-29):** five **hubs** — **Income** (`sales`, `payments`, `payouts`), **Spending** (`expenses`, `suppliers`), **Cash & Accounts** (`liabilities`), **Payroll** (`staff`), **Insights** (`money`, `reports`). Hub members share a horizontal tab strip when a hub has 2+ screens; **all active `?screen=` ids are unchanged** (e.g. `?screen=suppliers` still opens Suppliers inside Spending). Legacy **`?screen=taxes`** redirects to **`staff`** (Taxes module removed — log tax as operational expenses). **Admin-only:** **`?screen=users`** and **`?screen=audit-log`**. Legacy **`?screen=kiosk-orders`** → `order-support` via `LEGACY_SCREEN_ALIASES` in `cockpitNav.ts`. | **Local QA URL:** `http://127.0.0.1:4175/spec-ops?screen=home`. Task Master: `http://127.0.0.1:4175/spec-ops?screen=task-master`. Deep links: `?screen=staff` (Payroll), `?screen=payments`, `?screen=liabilities`, `?screen=suppliers`, `?screen=reports`. Hub config: `COCKPIT_HUBS` in `src/components/cockpit/cockpitNav.ts`. |
| `OrderApp.tsx` | E-point success → external `checkoutUrl`. Done screen → `/track?token=`. | External URL must be trusted (payment provider). |
| `PublicNotFound.tsx` | Denied/404 messaging for root + unknown paths. | No storefront auto-redirect from `/` or invalid paths. |
| `StaffAccessDeniedScreen.tsx` | Link via `getPublicOrderUrl()` (`VITE_PUBLIC_ORDER_URL` or same-origin `/order`). | OK. |
| `AdminOrderSupportScreen.tsx` | **Quick links** to floor surfaces: POS `/pos`, KDS `/kds`, Order Manager `/order-manager` (same-origin, keeps staff session), Kiosk via `getPublicKioskEntryUrl()` (`?key=` when `VITE_KIOSK_SECRET` set). | Opens each in a new tab. |

---

## 3. Edge Functions (HTTP)

Invoked from the browser (or webhooks):

| Function | Client usage | Auth |
|----------|----------------|------|
| `online-order-create` | `invokeEdgeFunction` POST (`OrderApp`) | Bearer: user JWT or anon key. |
| `epoint-create-payment` | `invokeEdgeFunction` POST (`OrderApp`) | Same. |
| `user-management` | `UsersScreen` GET `…/user-management/list`, POST `…/create`, DELETE `…/delete/:id`, PUT `…/update-role`, PUT `…/reset-password` | Bearer: staff session JWT. **Admin-only** (role `admin` in `public.users` or JWT claim). Writes `admin_audit_log` on create/delete/role-change/password-reset. |
| `admin-payment-recheck` | `PaymentsScreen` POST via `recheckPayment()` (`src/lib/adminApi.ts`) | Bearer: staff session JWT. **Admin/manager only**; routes to `payment-reconcile` or `united-payment-status-check` using `PAYMENT_RECONCILE_SECRET` server-side. Writes `admin_audit_log`. |
| `epoint-webhook` | Server-to-server (E-point) | Not a browser route. |
| `wolt-drive-*` | Backend / integrations | Not audited as SPA paths. |

### `user-management` path parsing

Uses suffix after `/user-management` in `req.url` so both deployed URL shapes work (e.g. `…/functions/v1/user-management/list`).

Token validation uses a user-scoped Supabase client (`SUPABASE_ANON_KEY` + `Authorization: Bearer <jwt>`) and `supabaseUser.auth.getUser()`, which supports ES256 JWTs.

### Logical risks

- **Managers** cannot call `user-management` (admin-only). If product needs “manager invites staff”, policy must change.
- **Create user** must insert `public.users` after Auth create; rollback on failure (implemented in Edge Function).
- **Cockpit-only `admin-api` tables** exclude `staff` via `TABLE_MIN_ROLE` (`products`, `sales_channels`, `combo_*`, all finance/tax/payroll, etc.). `sales` keeps `staff` for Order Manager status updates. See **§ Role-based access**.

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
