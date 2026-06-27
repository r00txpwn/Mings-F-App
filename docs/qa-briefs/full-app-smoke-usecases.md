# Full App Smoke — Use Case Catalog

Chrome DevTools MCP (or Playwright) smoke pass covering **every staff cockpit screen** and **every surface route**.

## Prerequisites

| Item | Value |
|------|--------|
| Staff preview | `npm run deploy:local` → `http://127.0.0.1:4175/` |
| Storefront preview | `npm run deploy:local:storefront` → `http://127.0.0.1:4176/` |
| Auth | Staff session (login once) or `.env.local` `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| SHA check | `http://127.0.0.1:4175/build-meta.json` → `gitSha` |

## Use cases (run sequentially)

### UC1 — Cockpit: Overview & Orders

| # | Screen | URL | Pass criteria |
|---|--------|-----|---------------|
| 1.1 | Home | `/spec-ops?screen=home` | KPI cards load (revenue, orders, **Cash on hand**, Outstanding debt); charts render |
| 1.2 | Order Support | `?screen=order-support` | Filters, search, date picker; no permission errors |
| 1.3 | Kiosk Orders | `?screen=kiosk-orders` | Queue stats + empty/filter state |
| 1.4 | Delivery | `?screen=delivery` | Zones tab, zone table, New zone |
| 1.5 | Order map | `?screen=order-locations` | Google Map + period filters |

### UC2 — Cockpit: Catalog

| # | Screen | URL | Pass criteria |
|---|--------|-----|---------------|
| 2.1 | Menu Builder | `?screen=menu-builder` | Categories + products; Modifiers tab |
| 2.2 | Combo deals | `?screen=combos` | Create combo form + upsell mapping |
| 2.3 | Products & Services | `?screen=products` | Product cards, low-stock alert |
| 2.4 | Suppliers | `?screen=suppliers` | Supplier cards, **Owed**, Add debt, Account |

### UC3 — Cockpit: Finance

| # | Screen | URL | Pass criteria |
|---|--------|-----|---------------|
| 3.1 | Sales | `?screen=sales` | Add sale form + recent sales table |
| 3.2 | Payments | `?screen=payments` | Payment filters; no 400/404 on API |
| 3.3 | Money | `?screen=money` | P&L summary + ledger tabs |
| 3.4 | Cash & Debt | `?screen=liabilities` | Tabs: Loans, Bank withdrawals, **Cash drawer** |
| 3.4b | Cash drawer tab | (click tab) | Opening/closing balance, in/out breakdown, movements CRUD |
| 3.5 | Expenses | `?screen=expenses` | OPEX / COGS / Categories tabs |
| 3.6 | Payouts | `?screen=payouts` | Platform payout list |
| 3.7 | Reports | `?screen=reports` | Period filters, channel breakdown, transaction history |

### UC4 — Cockpit: System

| # | Screen | URL | Pass criteria |
|---|--------|-----|---------------|
| 4.1 | Users | `?screen=users` | **Admin only** — non-admin redirects to Home |
| 4.2 | Settings | `?screen=settings` | Language (en/az/ru), theme, sales channels |

### UC5 — Staff surfaces (same staff bundle, path routes)

| # | Surface | URL | Pass criteria |
|---|---------|-----|---------------|
| 5.1 | Order Manager | `/order-manager` | Kitchen pause controls, New/In progress/Ready columns |
| 5.2 | Kiosk | `/kiosk` | Tap to order → Eat In → category menu |
| 5.3 | KDS | `/kds` | CONNECTED, Pending/Preparing/Ready columns |
| 5.4 | POS | `/pos` | New Order → menu → modifier modal → cart → **Cash/Card** toggle |

### UC6 — Storefront (separate build, port 4176)

| # | Surface | URL | Pass criteria |
|---|---------|-----|---------------|
| 6.1 | Online order | `http://127.0.0.1:4176/order` | Menu, cart sidebar, language switcher |
| 6.2 | Tracking (no token) | `/track` | “Missing tracking link” empty state |
| 6.3 | Tracking (bad token) | `/track?token=invalid` | “Order not found” |

## Console allowlist (non-blocking)

- Favicon manifest size warning
- `user_preferences` or similar **403** (RLS — known)
- Google Maps async loading warning (order map)
- `/_vercel/insights/script.js` 404 on local preview
- Form field `id`/`name` a11y issues (Settings)

## Fail criteria

- Login wall when session expected
- `permission denied for table …`
- Blank main content / infinite spinner > 15s
- HTTP **400/404** on Supabase REST for tables that exist in migrations

## Run log — 2026-06-26

**Environment:** `http://127.0.0.1:4175/` (staff), `http://127.0.0.1:4176/` (storefront)  
**Session:** `admin@system.local` (staff authenticated)  
**gitSha:** `d118472b3b66fa85d3f119a6823f736a82b66fce`

| UC | Check | Result | Notes |
|----|-------|--------|-------|
| UC1 | home | **PASS** | Cash on hand ₼200, charts OK (via UC4 redirect) |
| UC1 | order-support | **PASS** | 0 orders today |
| UC1 | kiosk-orders | **PASS** | Queue KPIs |
| UC1 | delivery | **PASS** | Baku Central zone |
| UC1 | order-locations | **PASS** | Map renders |
| UC2 | menu-builder | **PASS** | 2 noodle products |
| UC2 | combos | **PASS** | Upsell mapping |
| UC2 | products | **PASS** | Low stock alert |
| UC2 | suppliers | **PASS** | Debt UI |
| UC3 | sales | **PASS** | Historical sales |
| UC3 | payments | **PASS** | |
| UC3 | money | **PASS** | ₼1444 net profit |
| UC3 | liabilities + cash drawer | **PASS** | ₼200 cash on hand, opening float movement |
| UC3 | expenses | **PASS** | Empty state |
| UC3 | payouts | **PASS** | Wolt payout row |
| UC3 | reports | **PASS** | Channel breakdown |
| UC4 | users | **PASS*** | *Access gate: redirects to Home (account not admin role) |
| UC4 | settings | **PASS** | en/az/ru + channels |
| UC5 | order-manager | **PASS** | |
| UC5 | kiosk | **PASS** | Menu after Eat In |
| UC5 | kds | **PASS** | CONNECTED |
| UC5 | pos | **PASS** | Modifier modal → cart → Cash/Card |
| UC6 | /order | **PASS** | Menu + cart |
| UC6 | /track | **PASS** | Empty + invalid token states |

**Screenshots:** `test-results/full-app-qa/uc3-cash-drawer.png`, `uc5-pos-add-product.png`

## Re-run (Chrome DevTools MCP)

For each row in UC1–UC6, call `navigate_page` with the URL, then `wait_for` on the pass-criteria heading text, then `list_console_messages` and `list_network_requests` (filter status ≥ 400).
