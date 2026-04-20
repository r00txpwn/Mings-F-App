# URL & path audit (domain-rooted routing)

Last reviewed: 2026-04-18

## 1. Surface model (`src/main.tsx`)

Routing is now selected by `VITE_APP_SURFACE`:

- `order` surface (deploy to `order.mings.az`)
- `sp` surface (deploy to `sp.mings.az`)

### `VITE_APP_SURFACE=order`

| Normalized path | App | Notes |
|-----------------|-----|--------|
| `/` | `OrderApp` | Customer ordering root. |
| `/track` | `TrackingApp` | Tracking page. |
| `/order-manager` | `OrderManagerApp` | Staff-authenticated operations surface (mobile-first). |
| `/order` | Redirect to `/` | Legacy compatibility route. |
| **Anything else** | `PublicNotFound` | Non-customer paths denied. |

### `VITE_APP_SURFACE=sp`

| Normalized path | App | Notes |
|-----------------|-----|--------|
| `/` | `App` (staff cockpit) | Staff root. |
| `/sales`, `/products`, ... | `App` | Staff screen determined by pathname. |
| `/kiosk` | `KioskApp` | Separate operational surface. |
| `/kds` | `KitchenDisplay` | Separate operational surface. |
| `/order-manager` | `OrderManagerApp` | Also available on staff surface for operational access. |
| `VITE_ADMIN_APP_PATH` (default `/spec-ops`) | `App` (staff cockpit) | Supports custom admin entry path; default remains `/spec-ops`. |
| **Anything else** | `PublicNotFound` | Unknown path denied. |

## 2. Staff route mapping (`src/App.tsx`)

Staff navigation moved from query-param state (`?screen=...`) to real paths:

- `/` → home
- `/sales`
- `/kiosk-orders`
- `/menu-builder`
- `/combos`
- `/products`
- `/suppliers`
- `/expenses`
- `/payouts`
- `/money`
- `/reports`
- `/users`
- `/settings`

`?screen=...` is still accepted as a fallback for old links, but path routing is now primary.

## 3. Hosting rewrites and redirects (`vercel.json`)

- SPA fallback remains: `/(.*)` → `/index.html`
- Legacy redirect:
  - `order.mings.az/order` → `/`

## 4. Cross-surface links

- Staff links to customer storefront use `getOrderAppUrl()` from `src/lib/surfaceRouting.ts`.
- Host mapping defaults to `sp.*` → `order.*`, with optional override via `VITE_ORDER_APP_ORIGIN`.

## 5. Edge Functions (unchanged by route rework)

| Function | Client usage | Auth |
|----------|--------------|------|
| `online-order-create` | `invokeEdgeFunction` (`OrderApp`) | Bearer: anon/user token |
| `epoint-create-payment` | `invokeEdgeFunction` (`OrderApp`) | Bearer: anon/user token |
| `user-management` | `UsersScreen` admin operations | Bearer: staff session JWT (admin-only) |
| `epoint-webhook` | Server-to-server webhook | Not browser-routed |
| `wolt-drive-*` | Backend/integration | Not browser-routed |

## 6. Risks and checks

1. Ensure each Vercel project/domain sets the correct `VITE_APP_SURFACE`.
2. If you use a custom `VITE_ADMIN_APP_PATH`, ensure host rewrites route that path to `index.html` (do not redirect it to `/`).
3. Keep `/kiosk` and `/kds` behind secrets in production (`VITE_KIOSK_SECRET`, `VITE_KDS_SECRET`).
4. `/order-manager` uses staff auth (same guard as cockpit); verify non-staff users see access denied.
