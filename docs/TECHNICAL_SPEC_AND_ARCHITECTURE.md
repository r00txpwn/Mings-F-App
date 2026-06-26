# Ming's OS — Technical Specification & Architecture

**Last updated:** 2026-06-19  
**Audience:** Engineers, product owners, and QA  
**Related docs:** [APP_STRUCTURE.md](../APP_STRUCTURE.md), [URL_ROUTING_AUDIT.md](URL_ROUTING_AUDIT.md), [DEPLOY.md](../DEPLOY.md)

---

## 1. Executive Summary

**Ming's OS** (Mings F-App) is a custom restaurant technology platform built for Ming's — a Chinese fast-food cloud kitchen in Baku, Azerbaijan. It replaces fragmented third-party tooling with a unified system that owns the customer relationship, reduces aggregator commission dependency, and gives staff real-time operational control.

The platform is a **single Vite + React SPA codebase** that serves **multiple user surfaces** (staff cockpit, customer ordering, kiosk, kitchen display, POS, order manager) via **hostname and pathname routing**. All business logic that cannot run safely in the browser lives in **Supabase Edge Functions** backed by **PostgreSQL with Row Level Security (RLS)**.

| Property | Value |
|----------|-------|
| Currency | AZN (Azerbaijani Manat) |
| Languages | English, Azerbaijani, Russian |
| Primary domains | `sp.mings.az` (staff), `order.mings.az` (storefront) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Frontend | React 18, TypeScript 5.5, Vite 5, Tailwind CSS 3 |
| Routing | Custom path/hostname resolution — **no React Router** |

---

## 2. Business Context

### 2.1 Goals

- Reduce dependency on Wolt/Bolt commissions by driving direct online orders
- Provide branded customer ordering (`order.mings.az`) with delivery zone management
- Give kitchen and counter staff real-time visibility (KDS, order manager, POS)
- Consolidate finance, inventory, and channel analytics in one staff cockpit

### 2.2 Order Sources

All customer-facing orders converge on the `sales` table with a `source` discriminator:

| Source | Surface | Description |
|--------|---------|-------------|
| `online_delivery` | `/order` | Web delivery checkout |
| `online_takeaway` | `/order` | Web pickup checkout |
| `kiosk` | `/kiosk` | In-store self-service terminal |
| `pos_eat_in` | `/pos` | Counter eat-in |
| `pos_takeaway` | `/pos` | Counter takeaway |
| `pos_delivery` | `/pos` | Phone/counter delivery |
| `manual` | Staff cockpit | Manually recorded sales |

Kitchen (KDS) and order manager surfaces read from the same `sales` pipeline regardless of source.

---

## 3. System Architecture

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATIC HOSTING (Vercel)                           │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐ │
│  │  dist-staff/             │    │  dist-storefront/                    │ │
│  │  sp.mings.az             │    │  order.mings.az                      │ │
│  │  pos.mings.az            │    │                                      │ │
│  │  ─────────────────       │    │  ─────────────────                   │ │
│  │  Cockpit, KDS, Kiosk,    │    │  OrderApp, TrackingApp               │ │
│  │  POS, Order Manager      │    │                                      │ │
│  └────────────┬─────────────┘    └──────────────────┬───────────────────┘ │
└───────────────┼─────────────────────────────────────┼───────────────────────┘
                │  HTTPS (REST + Realtime WebSocket)  │
                ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE CLOUD                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │ PostgreSQL  │  │ Auth (JWT)   │  │ Realtime    │  │ Edge Functions     │ │
│  │ + RLS       │  │ Email/Phone  │  │ sales, etc. │  │ online-order-create│ │
│  │ 86+ migr.   │  │ Google OAuth │  │             │  │ united-payment-*   │ │
│  └─────────────┘  └──────────────┘  └─────────────┘  │ kds-*-update       │ │
│                                                         │ pos-order-create   │ │
│                                                         │ wolt-drive-*       │ │
│                                                         │ user-management    │ │
│                                                         └─────────┬──────────┘ │
└─────────────────────────────────────────────────────────────────┼───────────┘
                                                                  │
        ┌─────────────────────────────────────────────────────────┼───────────┐
        │ External integrations                                   ▼           │
        │  • United Payment / Epoint (card checkout + webhooks)                 │
        │  • Wolt Drive (delivery dispatch — manual + optional API)             │
        │  • Google Maps (delivery address autocomplete + zone polygons)      │
        │  • Twilio (phone OTP via Supabase Auth)                               │
        └───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LOCAL LAN (counter PC)                                                      │
│  apps/pos-print-agent  →  HTTP :9310  →  ESC/POS or ZPL thermal printer    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Architectural Principles

1. **Single codebase, multiple surfaces** — One repo; surfaces are selected at runtime by hostname/path, not separate apps.
2. **Split production bundles** — Staff JS is isolated from storefront JS (`build:staff` vs `build:storefront`) for security and bundle size.
3. **Backend in Edge Functions** — No separate NestJS/Express server. Mutations that need service role or secret keys run server-side.
4. **Realtime over custom WebSockets** — Supabase Realtime subscriptions drive KDS, order manager, and dispatch boards.
5. **RLS as authorization layer** — PostgreSQL policies enforce staff vs anon vs customer access; Edge Functions use service role where needed.
6. **Dark-first staff UI** — Cockpit uses `cockpit-*` design tokens; kiosk uses a separate light theme scope (`.kiosk-light`).

---

## 4. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Build | Vite 5 | Dual-mode builds (`staff` / `storefront`) |
| UI | React 18 + TypeScript 5.5 | Functional components, Context API |
| Styling | Tailwind CSS 3 | Custom cockpit palette in `index.css` |
| Icons | Lucide React | |
| Drag & drop | @dnd-kit/core | Kiosk order Kanban, admin order board |
| Client DB | @supabase/supabase-js 2.x | Auth, PostgREST, Realtime |
| Database | PostgreSQL (Supabase) | 86+ migrations |
| Serverless | Deno Edge Functions | Deployed via Supabase CLI |
| Maps | Google Maps JS API | Places (New), Geocoding — delivery checkout |
| Payments | United Payment / Epoint | Edge Functions + webhooks |
| Delivery | Wolt Drive | Manual dispatch default; optional API |
| Testing | Vitest (unit), Playwright (e2e) | |
| Hosting | Vercel (recommended) | Two projects for split deploy |
| Print | Node.js local agent | `apps/pos-print-agent` on LAN |

---

## 5. Build & Routing Model

### 5.1 Dual Build Targets

Production ships **two static artifacts** from the same source:

| Build command | Output | Entry file | Auth storage key | Preview port |
|---------------|--------|------------|------------------|--------------|
| `npm run build:staff` | `dist-staff/` | `src/main-staff.tsx` | `mings-staff-auth` | 4175 |
| `npm run build:storefront` | `dist-storefront/` | `src/main-storefront.tsx` | `mings-storefront-auth` | 4176 |

Local dev mirrors this: `npm run dev:staff` (opens `/spec-ops`) and `npm run dev:storefront` (opens `/order`).

### 5.2 Surface Resolution Order

Routing is implemented in `src/main-staff.tsx`, `src/main-storefront.tsx`, and `src/lib/surfaceHost.ts`:

1. **Normalize pathname** (trailing slash tolerant via `normalizePathname`)
2. **Check explicit paths** (`/kiosk`, `/kds`, `/pos`, `/order-manager`, etc.)
3. **Resolve hostname** via `VITE_SURFACE_*_HOSTS` env lists
4. **Fall back** to path-based routing on localhost / preview URLs
5. **Default unknown paths** → `PublicNotFound` (no auto-redirect to storefront)

### 5.3 Production Domain Map

| Domain | Bundle | Default surface at `/` | Other paths |
|--------|--------|------------------------|-------------|
| `sp.mings.az` | staff | Staff cockpit (`App.tsx`) | `/kds`, `/kiosk`, `/pos`, `/order-manager`, `/spec-ops` |
| `order.mings.az` | storefront | Customer ordering (`OrderApp`) | `/track`, `/order-manager` |
| `pos.mings.az` | staff | POS (`PosApp`) | — |

### 5.4 Admin Cockpit Navigation

The staff cockpit (`App.tsx`) uses **query-param screen switching** — not React Router:

```
/spec-ops?screen=home
/spec-ops?screen=kiosk-orders
/spec-ops?screen=delivery
/spec-ops?screen=order-support
```

Screens are synced to `window.history` via `pushState`. Valid screen keys are defined in the `Screen` union type in `App.tsx`.

---

## 6. Application Surfaces

### 6.1 Staff Cockpit (`App.tsx`)

**URL:** `/spec-ops` (override via `VITE_ADMIN_APP_PATH`)  
**Auth:** Supabase email/password; requires row in `public.users`  
**Theme:** Dark-first cockpit design

| Screen | Purpose |
|--------|---------|
| `home` | Executive KPIs, revenue vs costs, channel performance |
| `sales` | Record/edit sales by channel |
| `kiosk-orders` | Kanban board for live orders (kiosk + online + POS) |
| `order-support` | Order list + drawer with workflow actions |
| `delivery` | Delivery Control Center (zones, settings, dispatch) |
| `menu-builder` | Kiosk/online menu categories and products |
| `combos` | Combo deals configuration |
| `money` | Sales, expenses, purchases views |
| `reports` | Analytics filters and KPIs |
| `products` | Inventory, pricing, stock |
| `suppliers` | Supplier directory |
| `expenses` | COGS and operational expenses |
| `payouts` | Platform payout reconciliation |
| `users` | Staff user CRUD (admin-only, via Edge Function) |
| `settings` | Language, theme, sales channels |

**Role gates:**
- Non-staff authenticated users → `StaffAccessDeniedScreen`
- `user-management` Edge Function → admin only (`public.users.role = 'admin'` or JWT claim)

### 6.2 Customer Ordering (`OrderApp.tsx`)

**URL:** `/order` or `order.mings.az/`  
**Auth:** Optional — phone OTP, email/password, Google OAuth for accounts  
**Public:** Always accessible (wrapped in `ConfigCheck` only)

**Flow:**
```
Menu browse → Product detail (modifiers) → Cart → Checkout → Payment → Confirmation → /track?token=
```

**Features:**
- Fulfillment mode: delivery vs takeaway
- Google Maps address picker with zone polygon validation
- Scheduled time slots (server-validated lead time)
- Promo codes, tips, order notes, per-item notes
- Payment methods: card online (United Payment), cash on delivery/pickup
- Cart persistence in `localStorage`
- PWA manifest + service worker
- Account: order history, saved addresses, favorites, reorder

**Order creation:** `POST /functions/v1/online-order-create` (Edge Function validates prices, modifiers, zones, min order)

### 6.3 Order Tracking (`TrackingApp.tsx`)

**URL:** `/track?token=<track_token>`  
**Auth:** None — token-based public read via RPC `get_sale_tracking_public`

Shows order status progression, ETA, and delivery details for the customer.

### 6.4 Order Manager (`OrderManagerApp.tsx`)

**URL:** `/order-manager`, `/order-management`  
**Auth:** Staff session required  
**Layout:** Mobile-first with bottom nav

| Tab | Access | Purpose |
|-----|--------|---------|
| Active | All staff | Live order queue, status updates |
| Past | All staff | Completed/cancelled orders |
| Menu Editor | admin, manager | Toggle product visibility |

**Kitchen status strip:** Pause kitchen (30m / 1h / until next open / indefinite) via `online_settings` updates.

### 6.5 Kiosk (`KioskApp.tsx`)

**URL:** `/kiosk`  
**Gate:** Optional `SecretGate` when `VITE_KIOSK_SECRET` is set (`?key=`)  
**Theme:** Light Ming theme (cream/coral) scoped to `.kiosk-light`

**Flow:**
```
Idle (Eat In / Take Out) → Categories → Menu → Cart → Checkout → Confirmation
```

Writes to `sales` with `source = 'kiosk'`. Uses sticky footer with live total and "Order Now" CTA.

### 6.6 Kitchen Display System (`KitchenDisplay.tsx`)

**URL:** `/kds`  
**Auth:** Staff Supabase session required (same pattern as `/pos`)  
**Gate:** None — login screen replaces URL secret gate

**Architecture (Chowbus-style board):**
```
KitchenDisplay
  └── KdsHeader (filters, search, connection status)
  └── KdsBoard
        └── KdsColumn (pending | preparing | ready)
              └── KdsOrderCard
                    └── KdsLineItem (item-level prep toggle)
  └── KdsHistoryDrawer (completed today)
  └── KdsUndoToast
```

**Data:** Reads `sales` where `source IN (kiosk, online_*, pos_*)` and `order_status IN (pending, preparing, ready)`.

**Mutations:**
- Order status: Edge Function `kds-order-status-update` (validates payment before `preparing`)
- Item prep: Edge Function `kds-item-prep-toggle` (sets `sale_items.prepared_at`)

**Realtime:** Subscribes to `sales` and `sale_items` changes.

### 6.7 Point of Sale (`PosApp.tsx`)

**URL:** `/pos` or `pos.mings.az/`  
**Auth:** Staff session required

| Tab | Purpose |
|-----|---------|
| Active | Live POS orders |
| History | Past POS orders |
| New Order | Category rail + product grid + cart sidebar |
| Settings | Print agent URL, label profile |

**Order creation:** Edge Function `pos-order-create`  
**Printing:** HTTP POST to local `apps/pos-print-agent` (port 9310, LAN only)

POS sources map to `sales.source`: `pos_eat_in`, `pos_takeaway`, `pos_delivery`.

---

## 7. Data Architecture

### 7.1 Core Entity Model

```
sales_channels ──┐
                 ├── sales ─── sale_items ─── sale_item_modifiers
products ────────┘         │
master_categories          ├── delivery_orders (Wolt linkage)
combo_deals                └── online_payments
  └── combo_groups
        └── combo_group_items

online_settings (kitchen hours, pause, dispatch mode, coordinates)
delivery_zones (GeoJSON polygons, fees)
customer_profiles / customer_addresses / customer_favorites
users (staff roles: staff | manager | admin)
suppliers, purchases, operational_expenses, platform_payouts
modifier_groups → modifier_options
product_modifier_groups (M:N product ↔ modifier group)
```

### 7.2 Key Tables

| Table | Purpose |
|-------|---------|
| `sales` | Universal order/sale record — status, payment, delivery, tracking |
| `sale_items` | Line items with combo selections, notes, `prepared_at` |
| `sale_item_modifiers` | Snapshot of selected modifier options at order time |
| `products` | Catalog with `kiosk_visible`, `online_visible`, `is_halal`, soft-delete |
| `online_settings` | Kitchen open/close, hours JSON, prep time, pause state, coordinates |
| `delivery_zones` | GeoJSON polygons, delivery fees, active flag |
| `delivery_orders` | Wolt Drive job linkage and status |
| `online_payments` | Card payment sessions and reconciliation |
| `combo_deals` / `combo_groups` / `combo_group_items` | Combo meal configuration |
| `platform_payouts` | Third-party channel payout reconciliation |
| `users` | Staff role map (`id` matches `auth.users.id`) |

### 7.3 Order Status Pipeline

```
pending → preparing → ready → completed
                         ↘ cancelled
```

Additional timestamps: `prep_started_at`, `ready_at`, `estimated_ready_at`, `scheduled_for`.

Payment status (`payment_status`) gates KDS "Start preparing" for unpaid card orders.

### 7.4 TypeScript Source of Truth

Domain interfaces live in `src/lib/supabase.ts`. Screens and services import from this file — it is the client-side schema contract.

---

## 8. Backend — Edge Functions

All functions deploy to Supabase and are invoked via `{SUPABASE_URL}/functions/v1/{name}`.

### 8.1 Order & Kitchen

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `online-order-create` | POST | JWT or anon | Validate cart, create `sales` + line items |
| `pos-order-create` | POST | Staff JWT | Create POS order |
| `kds-order-status-update` | POST | Staff JWT | Update `sales.order_status` |
| `kds-item-prep-toggle` | POST | Staff JWT | Toggle `sale_items.prepared_at` |

### 8.2 Payments

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `united-payment-create-payment` | POST | JWT or anon | Create payment session |
| `united-payment-return` | GET | Public redirect | Customer return URL handler |
| `united-payment-webhook` | POST | Provider signature | Update payment + order status |
| `united-payment-status-check` | POST | Internal | Poll payment status |
| `epoint-create-payment` | POST | JWT or anon | Legacy Epoint session |
| `epoint-webhook` | POST | Provider signature | Legacy Epoint webhook |
| `payment-reconcile` | POST | Service | Reconciliation job |

### 8.3 Delivery (Wolt Drive)

| Function | Purpose |
|----------|---------|
| `wolt-drive-check` | Zone/coordinate validation |
| `wolt-drive-create` | Create delivery job (when API token set) |
| `wolt-drive-cancel` | Cancel delivery |
| `wolt-drive-webhook` | Status updates from Wolt |
| `wolt-drive-manual-dispatch` | Manual dispatch helper |
| `wolt-dispatch-book-lock` | 60s anti-double-booking lock |

### 8.4 Admin

| Function | Purpose |
|----------|---------|
| `user-management` | CRUD staff users (admin-only) |
| `admin-api` | Bundled admin operations |

### 8.5 Invocation Pattern (Client)

```typescript
// src/order/invokeEdge.ts
await fetch(`${SUPABASE_URL}/functions/v1/online-order-create`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${session?.access_token ?? anonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
```

Webhooks (`united-payment-webhook`, `epoint-webhook`, `wolt-drive-webhook`) are server-to-server — not browser routes.

---

## 9. Authentication & Authorization

### 9.1 Auth Providers

| User type | Method | Storage key |
|-----------|--------|-------------|
| Staff | Email + password | `mings-staff-auth` |
| Customer | Phone OTP (Twilio) | `mings-storefront-auth` |
| Customer | Email + password | `mings-storefront-auth` |
| Customer | Google OAuth | `mings-storefront-auth` |

Sessions persist in `localStorage` with auto-refresh. JWT expiry configured in Supabase Auth (recommended: 7 days).

### 9.2 Staff Authorization

```
auth.users (Supabase Auth)
    └── public.users (role: staff | manager | admin)
            └── RLS policies gate table access
            └── Edge Functions re-check role for sensitive ops
```

- **`isStaff`:** Row exists in `public.users`
- **`isAdminUser`:** JWT `app_metadata.role === 'admin'` OR `public.users.role === 'admin'`
- Authenticated customers (no `public.users` row) hitting staff surfaces → access denied screen

### 9.3 Row Level Security (RLS)

RLS policies enforce:
- **Anon:** Read active menu products, delivery zones, public tracking RPC
- **Authenticated staff:** Kitchen queue via `Staff can read all sales` (KDS uses staff session)
- **Authenticated customer:** Own profile, addresses, favorites, order history
- **Staff:** Read/write business tables per role
- **Service role (Edge Functions):** Bypass RLS for order creation, payment updates, webhooks

Key migrations: `20260614170000_harden_staff_only_rls`, `20260621120000_kds_staff_auth_drop_anon_policies`, `20260619120000_kds_item_prep_and_anon_update`.

### 9.4 Secret gates

`SecretGate.tsx` wraps `/kiosk` only:
- If `VITE_KIOSK_SECRET` is **empty** → kiosk is open (dev default)
- If set → `?key=` query param must match exactly

**KDS** uses staff login instead of URL secrets.

---

## 10. Real-Time Subscriptions

Supabase Realtime drives live UI updates:

| Surface | Subscribed tables | Events |
|---------|-------------------|--------|
| KDS | `sales`, `sale_items` | INSERT, UPDATE |
| Order Manager | `sales` | INSERT, UPDATE |
| Kiosk Orders (admin) | `sales`, `delivery_orders` | INSERT, UPDATE |
| Delivery Dispatch | `delivery_orders`, `sales` | INSERT, UPDATE |

Connection status is surfaced in KDS header and dispatch tabs. Offline banner prompts manual resubscribe.

---

## 11. Order Lifecycle (End-to-End)

```
┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ Customer │───▶│ Edge Function│───▶│  sales   │───▶│   KDS   │───▶│  Ready   │
│ checkout │    │ order-create │    │ pending  │    │ prepare │    │ dispatch │
└──────────┘    └─────────────┘    └──────────┘    └─────────┘    └────┬─────┘
                                                                        │
                     ┌──────────────────────────────────────────────────┘
                     ▼
              ┌─────────────┐    ┌──────────┐    ┌─────────────┐
              │ Wolt manual │───▶│ Courier  │───▶│  completed  │
              │ or API      │    │ delivery │    │  /track     │
              └─────────────┘    └──────────┘    └─────────────┘
```

**Payment branch (card online):**
1. Order created with `payment_status = pending`
2. `united-payment-create-payment` → redirect to provider
3. Webhook updates `online_payments` + `sales.payment_status`
4. KDS rejects `preparing` transition until paid

See [DELIVERY_JOURNEY.md](DELIVERY_JOURNEY.md) for stage-by-stage failure modes and mitigations.

---

## 12. POS & Print Subsystem

### 12.1 POS Desktop (optional)

`apps/pos-desktop/` — Electron wrapper for dedicated POS hardware (optional deployment path).

### 12.2 Print Agent

`apps/pos-print-agent/` — Local Node.js HTTP service:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness check |
| `POST /print` | Queue label job |
| `POST /test-print` | Sample label |
| `GET /queue/:jobId` | Job status |

**Profiles:** `escpos_80mm`, `zpl_58mm`, `zpl_40x30`  
**Persistence:** SQLite queue with 5s retry until printer ACK  
**Security:** LAN-only (no public exposure)

POS Settings tab configures print agent URL (default `http://127.0.0.1:9310`).

---

## 13. Internationalization & Theming

### 13.1 i18n

- **File:** `src/translations.ts`
- **Languages:** `en`, `az`, `ru` — all keys must exist in all three
- **Usage:** `const { t } = useLanguage()` → `t.keyName`
- **Persistence:** `LanguageContext` + `user_preferences` table
- **Product names:** Single `name` field in DB (English menu names are valid)

### 13.2 Theming

| Surface | Theme |
|---------|-------|
| Staff cockpit | Dark-first (`cockpit-*` tokens), light mode toggle |
| Kiosk | Light Ming theme (`.kiosk-light` scope) |
| OrderApp | Brand styling, responsive mobile/desktop |
| KDS | High-contrast dark board optimized for kitchen |

---

## 14. Deployment Architecture

### 14.1 Recommended Production Setup

| Component | Platform | Notes |
|-----------|----------|-------|
| Staff frontend | Vercel project `mings-staff` | `build:staff` → `dist-staff/` |
| Storefront frontend | Vercel project `mings-order` | `build:storefront` → `dist-storefront/` |
| Database + Auth | Supabase Cloud | Migrations via `npm run supabase:push` |
| Edge Functions | Supabase Cloud | Deploy via `npm run supabase:sync` |
| Print agent | Windows counter PC | Local Node process |

### 14.2 Deploy Order

1. `npm run supabase:push` — apply database migrations
2. Deploy Edge Functions (Supabase CLI or MCP)
3. Push frontend to Vercel (git-triggered or CLI after push)

### 14.3 Local Production Preview

```bash
npm run deploy:local              # staff → http://127.0.0.1:4175/
npm run deploy:local:storefront   # storefront → http://127.0.0.1:4176/
```

Each build writes `build-meta.json` with `gitSha` for QA verification.

### 14.4 SPA Rewrites

All routes must rewrite to `index.html` (200). Configured in `vercel.staff.json`, `vercel.storefront.json`, and root `vercel.json`.

CSP header must allow `connect-src` for `https://*.supabase.co` and `wss://*.supabase.co` (Realtime).

---

## 15. Security Model

| Concern | Mitigation |
|---------|------------|
| Admin surface exposure | Secret path (`/spec-ops`), not linked from public flows |
| KDS/Kiosk access | Kiosk: optional URL secret; KDS: staff login required |
| Customer data | RLS — customers see only own rows |
| Payment integrity | Server-side price validation in Edge Functions; webhook signature verification |
| Staff operations | JWT + `public.users` role check + RLS |
| Bundle isolation | Split builds prevent shipping admin code to storefront domain |
| Auth session bleed | Separate storage keys per build target |
| Service role keys | Never in client bundle — Edge Functions only |

---

## 16. Testing & Quality

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `tests/unit/` |
| E2E | Playwright | `tests/e2e/` (kds, kiosk, pos, smoke) |
| Type check | `tsc --noEmit` | `npm run typecheck` |
| Lint | ESLint | `npm run lint` |
| Env validation | `verify-env.mjs` | `npm run verify-env` |
| Full QA | Orchestrator | `npm run qa` |

E2E smoke tests run against local preview on port 4175 (staff bundle).

---

## 17. Environment Variables (Summary)

### Required (all builds)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |

### Staff-only

| Variable | Purpose |
|----------|---------|
| `VITE_SURFACE_ADMIN_HOSTS` | Hostname → cockpit |
| `VITE_KIOSK_SECRET` | Kiosk URL gate |
| `VITE_PUBLIC_ORDER_URL` | Link to storefront from staff UI |

### Storefront-only

| Variable | Purpose |
|----------|---------|
| `VITE_SURFACE_ORDER_HOSTS` | Hostname → OrderApp |
| `VITE_GOOGLE_MAPS_API_KEY` | Delivery address map |

### Edge Function secrets (Supabase Dashboard)

`KDS_SECRET`, `UNITED_PAYMENT_*`, `EPOINT_*`, `WOLT_*`, `APP_BASE_URL`, etc.

Full list: [.env.example](../.env.example)

---

## 18. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No React Router | Simpler static hosting; surfaces are top-level apps, not nested routes |
| Split Vercel projects | Security — admin JS never ships to customer domain |
| `sales` as universal order table | Single KDS/order-manager pipeline for all channels |
| Edge Functions over RPC | Complex validation, payment webhooks, and secret key access |
| Anon KDS access | Removed — KDS requires staff auth (migration `20260621120000`) |
| Manual Wolt dispatch default | API integration optional; staff copy-paste workflow always works |
| Modifier snapshot on order | `sale_item_modifiers` preserves menu state at order time |
| Soft-delete products | `is_deleted` flag instead of hard deletes |

---

## 19. File Organization Reference

```
mings-os/
├── src/
│   ├── main-staff.tsx          # Staff bundle entry
│   ├── main-storefront.tsx     # Storefront bundle entry
│   ├── App.tsx                 # Staff cockpit shell
│   ├── lib/supabase.ts         # Client + domain types
│   ├── lib/surfaceHost.ts      # Hostname routing
│   ├── contexts/               # Auth, Theme, Language
│   ├── screens/                # Cockpit screens
│   ├── order/                  # OrderApp, TrackingApp
│   ├── order-manager/          # OrderManagerApp
│   ├── kiosk/                  # KioskApp flow
│   ├── kds/                    # KitchenDisplay board
│   ├── pos/                    # PosApp
│   ├── services/analytics/     # KPI calculations (pure)
│   └── translations.ts         # i18n (en, az, ru)
├── supabase/
│   ├── migrations/             # 86+ SQL migrations
│   └── functions/              # 19 Edge Functions
├── apps/
│   ├── pos-print-agent/        # Local label printer service
│   └── pos-desktop/            # Optional Electron wrapper
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/                       # Feature and architecture docs
```

---

## 20. Related Documentation

| Doc | Topic |
|-----|-------|
| [APP_STRUCTURE.md](../APP_STRUCTURE.md) | File tree and screen inventory |
| [URL_ROUTING_AUDIT.md](URL_ROUTING_AUDIT.md) | Route map and edge cases |
| [DEPLOY.md](../DEPLOY.md) | Vercel, Supabase, env setup |
| [DELIVERY_JOURNEY.md](DELIVERY_JOURNEY.md) | Delivery flow and Wolt playbook |
| [COMBO_DEALS.md](COMBO_DEALS.md) | Combo meal configuration |
| [KITCHEN_HOURS.md](KITCHEN_HOURS.md) | Pause, soft-close, Baku timezone |
| [UNITED_PAYMENT_INTEGRATION.md](UNITED_PAYMENT_INTEGRATION.md) | Card payment setup |
| [RELIABILITY_QA_PRIORITIES.md](RELIABILITY_QA_PRIORITIES.md) | Manual QA focus areas |

---

## 21. Glossary

| Term | Definition |
|------|------------|
| Surface | A distinct user-facing app rendered from the same SPA codebase |
| Cockpit | Staff admin dashboard at `/spec-ops` |
| KDS | Kitchen Display System — real-time order board |
| POS | Point of Sale — counter/phone order entry |
| RLS | Row Level Security — PostgreSQL authorization policies |
| Edge Function | Supabase Deno serverless function |
| Source | `sales.source` discriminator for order origin channel |
| Track token | UUID in `sales.track_token` for public order tracking |
