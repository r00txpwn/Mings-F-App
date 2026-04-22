# Mings Financial Automation - App Structure

## Overview

Mings Financial Automation is a business management system for small to medium-sized businesses. It provides a unified **cockpit-style** dashboard to track sales, expenses, inventory, suppliers, and financial performance across multiple sales channels, plus **kiosk** self-service ordering and **kitchen display** (KDS) surfaces.

---

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Framework   | React 18 + TypeScript |
| Build tool  | Vite 5 |
| Styling     | Tailwind CSS 3 (`cockpit-*` design tokens, dark-first UI) |
| Icons       | Lucide React |
| Drag & drop | @dnd-kit/core (Kiosk orders Kanban) |
| Backend     | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Hosting     | Local: `npm run dev` / `npm run preview` (port **4173**); production: static host (e.g. Vercel) + Supabase |

---

## Entry Points & Routes

**Audit:** [docs/URL_ROUTING_AUDIT.md](docs/URL_ROUTING_AUDIT.md) — client paths, Edge Functions, known quirks.

**Reliability QA:** [docs/RELIABILITY_QA_PRIORITIES.md](docs/RELIABILITY_QA_PRIORITIES.md) — manual smoke priorities for order/payment, KDS, Wolt dispatch.

[`src/main.tsx`](src/main.tsx) chooses the root app by **pathname** (no `react-router`):

| Path      | App |
|-----------|-----|
| `/`       | [`PublicNotFound`](src/PublicNotFound.tsx) — admin-denied root surface (no auto-redirect). |
| `/spec-ops` | Staff cockpit ([`App.tsx`](src/App.tsx)) — default URL (`/spec-ops/` works). Override with `VITE_ADMIN_APP_PATH` in `.env` if needed. |
| `/kiosk`  | [`KioskApp`](src/kiosk/KioskApp.tsx) — customer kiosk |
| `/kds`    | [`KitchenDisplay`](src/kds/KitchenDisplay.tsx) — kitchen screen |
| `/order`  | [`OrderApp`](src/order/OrderApp.tsx) — public online ordering (no `SecretGate`). Delivery checkout uses a premium **Google Maps** address flow (Places API (New) autocomplete + draggable pin + reverse-geocode + zone polygons) when `VITE_GOOGLE_MAPS_API_KEY` is set — see [`src/order/AddressAutocomplete.tsx`](src/order/AddressAutocomplete.tsx), [`src/order/OrderAddressMap.tsx`](src/order/OrderAddressMap.tsx), [`src/order/googleMapsLoader.ts`](src/order/googleMapsLoader.ts), `.env.example`, and [`DEPLOY.md`](DEPLOY.md#google-maps-setup-required-for-the-customer-delivery-flow) for the APIs to enable. |
| `/track`  | [`TrackingApp`](src/order/TrackingApp.tsx) — public order status via `track_token` |
| *other*   | [`PublicNotFound`](src/PublicNotFound.tsx) — generic denied/404 (no admin hint, no `/order` push). |

**Secret gates:** [`SecretGate`](src/components/SecretGate.tsx) wraps `/kiosk` and `/kds`. If `VITE_KIOSK_SECRET` / `VITE_KDS_SECRET` is **unset or empty**, that surface is **open** (no `?key=` required — useful for local dev). If set, `?key=` must match exactly. **`/order` and `/track` are always public** (still wrapped with [`ConfigCheck`](src/ConfigCheck.tsx) so missing Supabase env fails fast).

**Staff URL:** Default **`/spec-ops/`** — not linked from customer flows. Optional `VITE_ADMIN_APP_PATH` overrides it.

**Adding staff without SQL each time:** Admins use **Users → Add New User** in the cockpit. The `user-management` Edge Function creates `auth.users` and inserts **`public.users`** (role: staff / manager / admin), so new people can log in at the secret admin URL. You still need **one** initial admin row in `public.users` (migration or one-time SQL); after that, use the UI only.

**Production static hosting:** SPA rewrites must serve `index.html` for `/order`, `/track`, `/kiosk`, `/kds`, and your secret admin path.

---

## File Organization

```
/project
├── index.html
├── .env                          # Gitignored; copy from .env.example
├── .env.example
├── package.json
├── vite.config.ts                # preview: port 4173, strictPort
├── tailwind.config.js            # cockpit palette, fonts
├── tsconfig.json / tsconfig.app.json
├── README.md
├── APP_STRUCTURE.md
│
├── /scripts
│   └── verify-env.mjs            # Checks required VITE_* without printing secrets
│
├── /src
│   ├── main.tsx                  # Path-based entry (App vs Kiosk vs KDS)
│   ├── App.tsx                   # Sidebar navigation shell (“Command Center”)
│   ├── index.css                 # Tailwind + cockpit utilities
│   ├── translations.ts           # i18n (en, az, ru)
│   ├── ConfigCheck.tsx           # Blocks app if Supabase env missing
│   ├── ErrorBoundary.tsx
│   ├── vite-env.d.ts
│   │
│   ├── /types
│   │   └── analytics.ts          # KPI / analytics TypeScript types
│   │
│   ├── /lib
│   │   └── supabase.ts           # Supabase client + domain interfaces
│   │
│   ├── /contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx      # Default theme: dark
│   │   └── LanguageContext.tsx
│   │
│   ├── /services/analytics
│   │   ├── index.ts              # Re-exports
│   │   ├── financeService.ts     # Revenue, channels, payouts, trends
│   │   ├── kpiCalculations.ts
│   │   ├── validation.ts
│   │   └── types.ts
│   │
│   ├── /components
│   │   ├── /analytics            # KpiCard, FilterBar, ChartCard, InsightPanel
│   │   ├── /cockpit              # PageHeader, shared layout primitives
│   │   ├── /kiosk
│   │   │   ├── KioskOrdersBoard.tsx   # Kanban + @dnd-kit
│   │   │   └── index.ts
│   │   ├── SecretGate.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── SearchableDropdown.tsx
│   │   ├── MenuCategoryManager.tsx
│   │   ├── MenuProductForm.tsx
│   │   ├── ProductModifierEditor.tsx
│   │   └── ProductModifierAssigner.tsx
│   │
│   ├── /screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx        # Executive KPIs, FilterBar, charts, channel drilldowns
│   │   ├── SalesScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   ├── SuppliersScreen.tsx
│   │   ├── ExpensesScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   ├── MoneyScreen.tsx
│   │   ├── PayoutsScreen.tsx     # Platform payouts + reconciliation
│   │   ├── MenuScreen.tsx        # Kiosk menu builder, modifiers
│   │   ├── KioskOrdersScreen.tsx # Kanban board for kiosk fulfillment
│   │   ├── DeliveryScreen.tsx    # Delivery Control Center shell (Zones / Settings / Dispatch tabs)
│   │   ├── SettingsScreen.tsx
│   │   └── UsersScreen.tsx
│   │
│   ├── /screens/delivery         # Delivery Control Center parts
│   │   ├── ZonesTab.tsx          # List + CRUD of delivery_zones rows
│   │   ├── ZoneEditorDialog.tsx  # Visual polygon draw/edit dialog + save form
│   │   ├── ZonePreviewMap.tsx    # Read-only polygon preview map
│   │   ├── SettingsTab.tsx       # online_settings: kitchen open, hours, prep time, dispatch mode
│   │   ├── DispatchTab.tsx       # Live delivery orders + Wolt actions
│   │   ├── useDeliveryAdmin.ts   # Realtime-backed data hook
│   │   └── validateZoneGeoJson.ts # Tolerant Polygon / Feature / FeatureCollection parser
│   │
│   ├── /screens/expenses
│   │   ├── ExpensesSummaryBar.tsx
│   │   ├── CategoryGroupedView.tsx
│   │   └── ManageCategoriesTab.tsx
│   │
│   ├── /kiosk                    # Customer-facing kiosk flow
│   │   ├── KioskApp.tsx
│   │   ├── KioskLayout.tsx
│   │   ├── IdleScreen.tsx, CategoryScreen.tsx, ProductScreen.tsx
│   │   ├── CartScreen.tsx, CheckoutScreen.tsx, ConfirmationScreen.tsx
│   │   └── …
│   │
│   └── /kds                      # Kitchen display
│       ├── KitchenDisplay.tsx
│       ├── KdsHeader.tsx
│       └── OrderCard.tsx
│   │
│   └── /order                    # Public web ordering + tracking
│       ├── OrderApp.tsx
│       ├── TrackingApp.tsx
│       ├── invokeEdge.ts         # Calls Supabase Edge Functions with anon key
│       └── /hooks/useOnlineMenu.ts
│
├── /supabase
│   ├── /functions
│   │   ├── user-management/index.ts   # Admin: users (auth-gated)
│   │   ├── online-order-create/index.ts # Validates cart + creates `sales` (service role)
│   │   ├── epoint-create-payment/index.ts
│   │   ├── epoint-webhook/index.ts
│   │   ├── wolt-drive-check/index.ts
│   │   ├── wolt-drive-create/index.ts
│   │   ├── wolt-drive-cancel/index.ts
│   │   └── wolt-drive-webhook/index.ts
│   └── /migrations/*.sql         # Schema evolution (40+ migration files)
│
└── /public                       # Static assets (if any)
```

---

## Screens (Admin Shell)

| Screen | Purpose |
|--------|---------|
| LoginScreen | Email/password via Supabase Auth |
| HomeScreen | KPI cards, date presets, revenue vs costs, channel performance, validation hints |
| SalesScreen | Record/edit sales by channel |
| ProductsScreen | Inventory, pricing, categories, stock reconciliation hooks |
| SuppliersScreen | Supplier directory |
| ExpensesScreen | COGS & operational expenses, categories |
| ReportsScreen | Analytics filters, KPIs, activity |
| MoneyScreen | Sales / expenses / purchases views |
| PayoutsScreen | Third-party payouts vs expected revenue |
| MenuScreen | Kiosk menu categories & products, modifiers |
| CombosScreen | Combo deals, group/item setup, upsell mapping |
| KioskOrdersScreen | **Kanban** for kiosk + online (`source` in kiosk / online_delivery / online_takeaway); realtime + `delivery_orders` |
| SettingsScreen | Language, theme, sales channels |
| UsersScreen | Admin user list/create/delete via Edge Function |

---

## Kiosk & KDS

| Surface | Role |
|---------|------|
| **Kiosk** (`/kiosk`) | Browse menu, cart, checkout; writes to `sales` with `source = kiosk` |
| **KDS** (`/kds`) | Read/update **kiosk + online** orders (`order_status` pipeline) for kitchen |
| **Kiosk orders (admin)** | Monitor same-day orders (kiosk + online) in Kanban; realtime on `sales` |
| **Order manager** (`/order-manager`) | Staff-authenticated mobile-first operations view: active flow, past orders, menu toggles |
| **Online** (`/order` / `/track`) | Public menu (`products.online_visible`, optional `products.is_halal` badge), checkout via Edge `online-order-create` (ASAP + scheduled slots); tracking via RPC `get_sale_tracking_public` |

Combo docs: [docs/COMBO_DEALS.md](docs/COMBO_DEALS.md)

---

## Components (Selected)

| Area | Purpose |
|------|---------|
| **analytics/** | KpiCard, FilterBar, ChartCard, InsightPanel — shared dashboard/reports |
| **cockpit/** | PageHeader, design-aligned panels and tables |
| **kiosk/KioskOrdersBoard** | Drag-and-drop columns (`@dnd-kit/core`) |
| SecretGate | Optional URL key when env secret is set |
| LineChart / PieChart | SVG charts |
| DateRangePicker | Date range for filters |

---

## Contexts (Global State)

| Context | Manages |
|---------|---------|
| AuthContext | Session, signIn/signOut |
| ThemeContext | Light/dark (default **dark**) |
| LanguageContext | `en` / `az` / `ru` |

---

## Database Schema (summary)

### Core tables

| Table | Purpose |
|-------|---------|
| sales_channels | Channel definitions (logos, icons, active flag) |
| sales | Sales rows (`source`: manual, kiosk, `online_delivery`, `online_takeaway`; `order_status`; `track_token`; delivery fields: `delivery_address`, `delivery_apartment`, `delivery_floor`, `delivery_notes`, `delivery_lat`/`delivery_lng`, `delivery_fee`, `delivery_zone_id`) |
| products | Catalog, stock, `kiosk_visible`, `online_visible`, `is_halal`, combo upsell flags |
| combo_deals / combo_groups / combo_group_items | Combo catalog and group-item mapping |
| online_settings | Takeaway/delivery toggles, hours JSON, min order, scheduled slot/lead-time settings, kitchen anchor coordinates (`kitchen_lat`/`kitchen_lng`) |
| delivery_zones | GeoJSON polygons, fees (active zones readable publicly) |
| online_payments | E-point / card rows (admin read; writes via Edge service role) |
| delivery_orders | Wolt Drive linkage (admin read; writes via Edge service role) |
| suppliers | Supplier records |
| purchases | Purchase / COGS |
| master_categories | Category hierarchy |
| operational_expenses / expense_items | Expense tracking |
| platform_payouts | Payout reconciliation vs channels |

### Other

- RLS on user-facing tables; UUID PKs; audit triggers where migrated.
- **Migrations:** `supabase/migrations/*.sql` (40+ files).

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| **user-management** | `GET` list users, `POST` create, `DELETE` by id — requires authenticated JWT; **admin** check (`app_metadata.role` / `users.role`) |
| **online-order-create** | `POST` JSON cart — validates prices/modifiers (per-group `min_select` / `max_select`), zones; inserts `sales` + line items (including combo selections and combo component modifiers) |
| **epoint-create-payment** | Prepares `online_payments` row + placeholder checkout URL (configure real E-point per docs) |
| **epoint-webhook** | Updates `online_payments` + `sales.payment_status`; verifies Epoint `data`+`signature` (SHA1) with `EPOINT_PRIVATE_KEY`, or optional legacy HMAC JSON with `EPOINT_WEBHOOK_SECRET` |
| **wolt-drive-check** | Zone / coordinate helper (optional Wolt ping when token set) |
| **wolt-drive-create** | Creates `delivery_orders` stub or real API integration |
| **wolt-drive-cancel** | Cancels delivery row |
| **wolt-drive-webhook** | Updates `delivery_orders` when `WOLT_WEBHOOK_SECRET` header matches |

---

## Authentication & Roles

- Supabase Auth (JWT).
- `AuthContext` + RLS on backend.
- User management from **UsersScreen** calls Edge Function with session token.

---

## Internationalization

- Languages: **en**, **az**, **ru** in [`src/translations.ts`](src/translations.ts).
- Language persisted (user preferences + localStorage).

---

## Theme

- Cockpit-oriented **dark-first** styling; light mode available in Settings.
- Tailwind `cockpit-*` utilities in [`src/index.css`](src/index.css).

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Required — Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Required — anon key |
| `VITE_KIOSK_SECRET` | Optional — if set, `/kiosk?key=` must match; if empty, kiosk works without key |
| `VITE_KDS_SECRET` | Optional — same pattern for `/kds` |

Use `npm run verify-env` to confirm required vars are present (values not printed).

---

## Local Production Preview

- `npm run build` → `dist/`
- `npm run preview` → **http://127.0.0.1:4173/** (fixed port; fails if 4173 is busy — see `vite.config.ts`)

SPA routes `/`, `/kiosk`, `/kds`, `/order`, `/track`, and admin path `/spec-ops` (or your `VITE_ADMIN_APP_PATH`) need host rewrites when deploying to static hosting (e.g. `vercel.json` → all routes to `index.html`).

---

## Key Patterns

- **State:** React Context (no Redux).
- **Data:** Supabase client in screens/services; `services/analytics` for shared KPI/finance queries.
- **Navigation:** Screen state in `App.tsx` (no React Router).
- **Charts:** Custom SVG (`LineChart`, `PieChart`).
- **Styling:** Tailwind + cockpit component classes.
- **Kiosk orders UI:** `@dnd-kit` drag-and-drop between status columns.
