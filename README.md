Mings-F-App

## Local production preview

**One command (build + serve production bundle):**

```bash
npm run deploy:local
```

Runs `npm run build` then `vite preview` on **127.0.0.1**. Default port is **4173**; if it’s busy, Vite picks the next free port (check the terminal for `Local: http://127.0.0.1:…`).

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for Vercel/Netlify/Supabase CLI steps. Production build: `npm run build` → `dist/`.

## Auth basics (`/order` + staff)

- Enable **Confirm sign up** in Supabase Auth for email/password signups.
- Enable **Reset password** in Supabase Auth so storefront users can recover accounts.
- Keep redirect URLs aligned with your live origins (for this project typically `https://order.mings.az/**` and `https://sp.mings.az/**`).
- Google OAuth and email recovery links should return users to `/order` to complete sign-in/reset flows.

## Storefront checkout highlights

- Cart state persists across refresh (`cart`, fulfillment mode, selected saved address).
- Cart lines support per-item notes and those notes are passed to `online-order-create`.
- Account order history includes a one-tap reorder action that rebuilds the cart from prior sale items.
- Checkout supports `ASAP` and scheduled time-slot ordering (lead-time guarded server-side).
- Checkout includes promo code, tip, order notes, consent checkbox, and retry button on submit errors.
- PWA basics enabled (`/manifest.webmanifest` + service worker registration) for installability and offline fallback.
- Delivery Control Center settings include editable kitchen coordinates, used by staff/order-tracking distance and ETA calculations.

## Feature docs

- Combo deals: **[docs/COMBO_DEALS.md](docs/COMBO_DEALS.md)**
- Delivery journey: **[docs/DELIVERY_JOURNEY.md](docs/DELIVERY_JOURNEY.md)**

Domain-rooted routing:
- `order.mings.az` uses `VITE_APP_SURFACE=order` (`/` for customer ordering, `/track` for tracking, `/order-manager` for staff ops).
- `sp.mings.az` uses `VITE_APP_SURFACE=sp` (`/` for staff cockpit, plus `/kiosk`, `/kds`, and `/order-manager`).
- Runtime host safety: hostnames take precedence (`order.*` => order surface, `sp.*` => staff surface), so both domains can coexist on one Vercel project.
