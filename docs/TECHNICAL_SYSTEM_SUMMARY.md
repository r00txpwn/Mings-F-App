# Mings F-App Technical System Summary

## Purpose

This document summarizes the currently built system across frontend surfaces, backend workflows, Supabase data model, and operational flows. It is intended as a technical snapshot of what exists today, including the core user journeys and the recent workflow improvements that are already reflected in the codebase and database.

## High-Level Architecture

The application is a shared Vite + React + TypeScript codebase backed by Supabase. One repo powers multiple operational surfaces:

- `sp.mings.az` or `/<admin path>`: staff/admin cockpit
- `order.mings.az`: public customer ordering surface
- `order.mings.az/track` or `/track`: public order tracking
- `order.mings.az/order-manager` or `/order-manager`: staff order workflow surface
- `/kiosk`: self-service kiosk
- `/kds`: kitchen display system

The app uses:

- React 18 + TypeScript
- Vite build + preview/static hosting
- Supabase Auth, Postgres, Realtime, Edge Functions
- Shared translation system in `src/translations.ts`
- Shared `sales` table as the canonical order record

## Surface Routing and Entrypoints

Primary entry logic lives in `src/main.tsx`.

### Surface Resolution

The app resolves surfaces using:

- hostname-based routing via `src/lib/surfaceHost.ts`
- path-based fallback routing for local preview / localhost

### Supported Surface Entrypoints

| Surface | Host / Path | Main Component |
|---|---|---|
| Admin cockpit | admin host or admin path | `src/App.tsx` |
| Customer order | order host or `/order` | `src/order/OrderApp.tsx` |
| Tracking | track host or `/track` | `src/order/TrackingApp.tsx` |
| Staff order workflow | order host `/order-manager` or `/order-management`, or path fallback | `src/order-manager/OrderManagerApp.tsx` |
| Kiosk | kiosk host or `/kiosk` | `src/kiosk/KioskApp.tsx` |
| KDS | kds host or `/kds` | `src/kds/KitchenDisplay.tsx` |

### Admin Shell Navigation

The staff cockpit in `src/App.tsx` resolves screens via query string:

- `?screen=home`
- `?screen=sales`
- `?screen=kiosk-orders`
- `?screen=order-support`
- `?screen=delivery`

On **path-based** hosts (e.g. local `127.0.0.1:4175`), the cockpit is only mounted under the resolved admin path (**default `/spec-ops`**). Order Support is reached as **`/spec-ops?screen=order-support`**, not `/?screen=order-support` (root may render `PublicNotFound`). On **`sp.mings.az`**, the admin surface loads `App` for the whole origin, so `https://sp.mings.az/?screen=order-support` is valid.
- `?screen=menu-builder`
- `?screen=combos`
- `?screen=products` (inventory screen — hidden from sidebar; Menu Builder + Expenses COGS cover day-to-day catalog)
- `?screen=suppliers`
- `?screen=expenses`
- `?screen=payouts`
- `?screen=money`
- `?screen=reports`
- `?screen=users`
- `?screen=settings`

The admin shell is protected by the shared auth gate:

- `AuthProvider`
- `isStaff` check from `public.users`
- `StaffAccessDeniedScreen` for signed-in non-staff users

## Shared Auth and Role Model

The staff model is intentionally split:

- `auth.users`: sign-in identity
- `public.users`: application staff profile and role

Staff access is granted only if a signed-in auth user has a matching row in `public.users`.

### Staff Roles

Current staff roles:

- `admin`
- `manager`
- `staff`

Role data is exposed through `src/contexts/AuthContext.tsx`.

## Core Order Data Model

The canonical order table is `public.sales`.

### Important `sales` Fields

Key workflow fields in `sales` include:

- `source`
  - `kiosk`
  - `online_delivery`
  - `online_takeaway`
- `order_status`
  - `pending`
  - `awaiting_payment`
  - `preparing`
  - `ready`
  - `dispatched`
  - `completed`
  - `cancelled`
- `payment_status`
- `prep_started_at`
- `estimated_ready_at`
- `ready_at`
- `dispatched_at`
- `completed_at`
- `scheduled_for`
- `reminder_at`
- `customer_name`
- `customer_phone`
- `delivery_address`
- `delivery_lat`
- `delivery_lng`
- `track_token`
- `created_by`
- `customer_user_id`

Related tables:

- `sale_items`
- `sale_item_modifiers`
- `delivery_orders`
- `online_settings`
- `delivery_zones`
- `online_payments`
- `saved_cards`
- `customer_profiles`
- `customer_addresses`

## Frontend Surfaces and Workflows

## 1. Admin Cockpit

Main shell: `src/App.tsx`

This is the operations center for staff/admin users. It contains the full admin navigation and wraps multiple operational screens.

### Admin Capabilities

- view sales and business KPIs
- manage menu/products/modifiers/combos
- manage suppliers and expenses
- manage payouts and money flows
- manage staff users
- operate delivery settings/zones/dispatch
- monitor kiosk and online order queues
- access the newer order support workflow

## 2. Kiosk Orders Screen

File: `src/screens/KioskOrdersScreen.tsx`

This screen provides a mixed operational board for:

- kiosk orders
- online delivery orders
- online takeaway orders

### Features

- realtime refresh from `sales` + `delivery_orders`
- date range filtering using `sale_date`
- source filtering
- payment filtering
- text search by order number / phone / id
- dashboard cards:
  - total orders
  - orders in queue
  - awaiting payment
  - today revenue
- payment confirmation action
- status progression actions

### Realtime

The screen subscribes to:

- `sales` changes filtered by source
- `delivery_orders` changes

### Action Flow

- status changes update `sales.order_status`
- confirming payment updates `sales.payment_status = 'paid'`
- after mutation, the screen reloads the order list

## 3. Order Support Screen

File: `src/screens/AdminOrderSupportScreen.tsx`

This is the newer Wolt-like support screen inside the admin cockpit. It is operationally distinct from the legacy kiosk-oriented board.

### Features

- real-time list of orders across kiosk and online channels
- status filter chips:
  - all
  - active
  - dispatched
  - completed
  - cancelled
- source filter
- search by order number, customer name, and phone
- date-range filtering on `created_at`
- order list with:
  - time
  - customer
  - item summary
  - total
  - status
- action button to open the public order page

### Realtime

Uses a Supabase channel on `sales` to reload when orders change.

### Current Limitation

The right-side drawer is currently a placeholder:

- order list works
- details drawer content is not yet implemented

## 4. Delivery Control Center

Files:

- `src/screens/DeliveryScreen.tsx`
- `src/screens/delivery/ZonesTab.tsx`
- `src/screens/delivery/SettingsTab.tsx`
- `src/screens/delivery/DispatchTab.tsx`
- `src/screens/delivery/useDeliveryAdmin.ts`

This is the admin-facing delivery control center.

### Tabs

- `zones`
- `settings`
- `dispatch`

### Zones Tab

Allows staff to:

- create delivery zones
- edit zone polygons
- configure:
  - name
  - fee
  - minimum order
  - free delivery threshold
  - sort order
  - active state

Zones are backed by `delivery_zones`.

### Settings Tab

Allows staff to control:

- kitchen open/closed state
- delivery enabled
- takeaway enabled
- global minimum order
- default preparation time
- global free-delivery threshold
- dispatch mode:
  - `auto`
  - `manual`
- operating hours by weekday
- kitchen location metadata in `online_settings`

### Dispatch Tab

Allows staff to monitor and act on active delivery work:

- view dispatchable orders
- inspect addresses and status
- open or copy tracking links
- mark manual dispatch
- trigger dispatch-related actions

This integrates with `delivery_orders` and Wolt-related edge functions.

## 5. Dedicated Order Manager Surface

Files:

- `src/order-manager/OrderManagerApp.tsx`
- `src/order-manager/ActiveOrdersTab.tsx`
- `src/order-manager/PastOrdersTab.tsx`
- `src/order-manager/MenuEditorTab.tsx`

This is the dedicated staff-facing order workflow app, separate from the main admin shell.

### Tabs

- Active Orders
- Past Orders
- Menu Editor

### Active Orders Workflow

The active workflow is split into operational columns:

- new
- scheduled
- in progress
- ready
- in delivery

### Active Orders Behaviors

- loads `sales` filtered to active order states
- joins `delivery_orders` for delivery metadata
- subscribes to realtime changes on:
  - `sales`
  - `delivery_orders`
- uses a polling fallback
- can reconnect realtime explicitly
- surfaces inline action errors
- plays ringtone for new orders

### Status Actions

The UI supports these operational transitions:

- Accept
  - `pending -> preparing`
  - sets `prep_started_at`
  - sets `estimated_ready_at`
- Mark Ready
  - `preparing -> ready`
  - sets `ready_at`
- Self Dispatch
  - `ready -> dispatched`
  - sets `dispatched_at`
- Picked Up / Delivered
  - moves order to `completed`
  - sets `completed_at`
- Scheduled reminder workflows update `reminder_at`
- Reject flow updates `order_status = cancelled` and `cancellation_reason`

### Staff authorization on `sales` updates (RLS + trigger)

Authenticated users whose `public.users.role` is `staff`, `manager`, or `admin` may `UPDATE` `public.sales` under the policy introduced in migration `20260422100500_fix_staff_sales_update_policy.sql` (**`Staff, manager, admin can update sales`**), replacing the older “own sale only” constraint so Order Manager can progress **online** rows where `created_by` may be null or another user. Follow-up migrations `20260422103000_expand_staff_workflow_update_columns.sql` and `20260422104500_allow_staff_complete_orders.sql` widen the **`BEFORE UPDATE`** trigger `enforce_staff_sales_workflow_update` so **staff** may touch workflow timestamps (`ready_at`, `dispatched_at`, `completed_at`, etc.) and set `order_status` to **`completed`**, while still blocking arbitrary edits to unrelated financial columns.

### Past Orders Workflow

`PastOrdersTab.tsx` supports:

- preset date ranges:
  - today
  - yesterday
  - last 7 days
  - this month
  - last month
- status filter chips:
  - all
  - ready
  - completed
  - dispatched
  - cancelled
- total revenue badge for the currently filtered set
- expandable past order cards with line items and customer info

The recent logic change intentionally includes `ready` in the historical view because operationally users need to see orders from the selected date even if they were not fully completed.

## 6. Customer Order Surface

File: `src/order/OrderApp.tsx`

This is the public ecommerce/order placement flow.

### Main Responsibilities

- load online menu
- maintain cart state
- handle customer auth/profile/address data
- support delivery and takeaway
- enforce minimum order logic
- validate delivery zone and location
- support scheduled ordering
- initiate payment flow
- show success flow and tracking handoff

### Customer Flow

1. browse menu
2. manage cart
3. authenticate or use customer profile
4. choose fulfillment:
   - takeaway
   - delivery
5. provide delivery details if required
6. validate zone/minimum/schedule
7. submit order via edge function
8. if card payment:
   - initialize EPoint payment
   - handle return state
9. land in confirmation state
10. continue to tracking

## 7. Tracking Surface

File: `src/order/TrackingApp.tsx`

This is the public post-checkout tracking screen.

### Workflow

- accepts `track_token`
- fetches public tracking data through Supabase RPC
- subscribes to live order updates
- renders status progression over time
- can show delivery ETA-related information when available

## 8. Kiosk Surface

File: `src/kiosk/KioskApp.tsx`

This is the self-service on-prem ordering surface.

### Workflow

- protected by kiosk secret gate
- flow:
  - idle
  - menu
  - cart
  - checkout
  - confirmation
- inactivity timeout resets the kiosk to idle
- supports upsell/product detail modal flows

## 9. Kitchen Display System (KDS)

File: `src/kds/KitchenDisplay.tsx`

This is the kitchen-facing execution board.

### Features

- protected by KDS secret
- subscribes to live `sales` updates
- shows active kitchen workload
- supports kitchen progression actions:
  - start preparing
  - ready
  - complete
- highlights payment state and prep metadata
- shows connection status and reconnect behavior

## Backend and Edge Function Workflows

## Supabase Client

Frontend client and TS domain models are centralized in:

- `src/lib/supabase.ts`

This file is the app-side source of truth for many frontend data types and client setup.

## Key Edge Functions

### `online-order-create`

Responsibilities:

- validate checkout payload
- validate fulfillment and scheduling
- validate zone/minimum order rules
- create sale and line items
- generate track/payment initialization data

### `epoint-create-payment`

Responsibilities:

- initialize hosted EPoint payment
- associate payment with a sale
- support return flow state

### `epoint-webhook`

Responsibilities:

- accept payment callbacks
- validate signatures/shape
- update payment and sale state

### Wolt / Delivery Functions

- `wolt-drive-create`
- `wolt-drive-webhook`
- `wolt-drive-check`
- `wolt-drive-manual-dispatch`
- `wolt-drive-cancel`
- `wolt-dispatch-book-lock`

Responsibilities include:

- delivery task creation
- webhook updates
- dispatch checks
- manual dispatch workflows
- booking lock coordination
- cancellation flow

### `user-management`

This edge function is admin-facing and supports:

- list staff users
- create user
- delete user
- update role
- reset password

Notable behavior:

- ES256-safe auth verification using a user-scoped Supabase client
- admin authorization checks
- staff list derived from `public.users`, not from auth email heuristics

## RLS and Workflow Enforcement

The order workflow relies heavily on `public.sales` RLS and trigger logic.

### Important Current Policy Behavior

Recent migrations replaced the older update restriction based only on `created_by`.

Current intent:

- `admin` can update any sale
- `manager` can update any sale
- `staff` can update operational workflow fields for allowed lifecycle states

This is necessary because many online orders have:

- `created_by = null`

so ownership-based policies would block staff workflows.

### Staff Workflow Guard

Recent migrations introduced a trigger-based guard function:

- `public.enforce_staff_sales_workflow_update()`

Its purpose is to:

- allow staff to update workflow-only fields
- block financial or unrelated edits
- restrict status transitions to operational order states

Recent follow-up migrations expanded allowed staff fields to support real UI actions such as:

- accept
- ready
- picked up
- delivered
- reminder scheduling
- cancellation reason
- payment confirmation

## Recent Workflow Improvements Reflected in the System

The following improvements are now part of the built system:

### Order Manager Realtime Hardening

- explicit reconnect behavior
- subscription status tracking
- auth-aware realtime initialization
- reload on subscribe/reconnect
- visible inline action errors

### Online Settings / Kitchen Coordinates Fix

- runtime no longer depends on non-existent `online_settings.kitchen_lat/lng` columns in the broken path
- database migration for kitchen coordinates was applied directly through Supabase MCP

### CSP / Realtime Compatibility

- Vercel CSP was updated to allow:
  - `https://*.supabase.co`
  - `wss://*.supabase.co`

This is required for Supabase Realtime WebSocket traffic.

### Translation Coverage Expansion

Missing translation sets were filled for:

- order support screen
- delivery screen and delivery tabs
- kiosk orders operational screen

This resolved raw fallback keys appearing in the UI.

### Page Header Simplification

The global `PageHeader` subtitle line was removed centrally so descriptive subtitle text no longer appears beneath page titles across the admin/cockpit screens.

### Past Orders UX Improvements

- `ready` orders included in the historical query
- status filter chips added
- highlighted revenue badge added to the filter row

## Known Operational Constraints

There are still some visible, intentional constraints in the current system:

- `AdminOrderSupportScreen` order-support drawer shows full order details, line items (modifiers), delivery address when applicable, and workflow actions (`Accept` / quick prepare, `Ready`, dispatch / picked up, `Delivered`) via the same `sales` row updates as Order Manager
- some screens still have pre-existing lint warnings unrelated to the workflows
- local preview requires a hard refresh after rebuilding because Vite preview can otherwise serve an older build already running on port `4175`
- translation fallback intentionally shows the missing key name, which is useful for identifying missing i18n coverage

## File Index for Major Areas

### Frontend

- `src/main.tsx`
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/LanguageContext.tsx`
- `src/order-manager/OrderManagerApp.tsx`
- `src/order-manager/ActiveOrdersTab.tsx`
- `src/order-manager/PastOrdersTab.tsx`
- `src/screens/AdminOrderSupportScreen.tsx`
- `src/screens/KioskOrdersScreen.tsx`
- `src/screens/DeliveryScreen.tsx`
- `src/order/OrderApp.tsx`
- `src/order/TrackingApp.tsx`
- `src/kiosk/KioskApp.tsx`
- `src/kds/KitchenDisplay.tsx`
- `src/components/cockpit/PageHeader.tsx`

### Backend / Supabase

- `src/lib/supabase.ts`
- `supabase/functions/user-management/index.ts`
- `supabase/functions/online-order-create/index.ts`
- `supabase/functions/epoint-create-payment/index.ts`
- `supabase/functions/epoint-webhook/index.ts`
- `supabase/functions/wolt-drive-create/index.ts`
- `supabase/functions/wolt-drive-webhook/index.ts`
- `supabase/functions/wolt-drive-manual-dispatch/index.ts`
- `supabase/functions/wolt-dispatch-book-lock/index.ts`

### Recent Migration Files

- `supabase/migrations/20260422100500_fix_staff_sales_update_policy.sql`
- `supabase/migrations/20260422103000_expand_staff_workflow_update_columns.sql`
- `supabase/migrations/20260422104500_allow_staff_complete_orders.sql`
- `supabase/migrations/20260422200000_wolt_booking_lock_and_scheduled_guard.sql`
- `supabase/migrations/20260422201000_kiosk_anon_update_cancellation_reason_bound.sql`
- `supabase/migrations/20260422210000_products_combo_soft_delete_scheduled_future.sql`

## Summary

The system now consists of a multi-surface operational platform built around a shared `sales` lifecycle and Supabase realtime. The main operational capabilities currently implemented are:

- public ordering and payment initialization
- real-time tracking
- kiosk ordering
- kitchen execution
- staff order workflow management
- delivery control center
- mixed-channel admin queue management
- staff user administration
- multilingual UI support across operational surfaces

The most important architectural idea is that all surfaces are different operational views over the same shared order model and supporting delivery/payment/admin tables, with workflow safety enforced by both frontend behavior and Supabase-side policies/triggers.
