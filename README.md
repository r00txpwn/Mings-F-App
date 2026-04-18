Mings-F-App

## Local production preview

**One command (build + serve production bundle):**

```bash
npm run deploy:local
```

Runs `npm run build` then `vite preview` on **127.0.0.1**. Default port is **4173**; if it’s busy, Vite picks the next free port (check the terminal for `Local: http://127.0.0.1:…`).

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for Vercel/Netlify/Supabase CLI steps. Production build: `npm run build` → `dist/`.

## Feature docs

- Combo deals: **[docs/COMBO_DEALS.md](docs/COMBO_DEALS.md)**

Domain-rooted routing:
- `order.mings.az` uses `VITE_APP_SURFACE=order` (`/` for customer ordering, `/track` for tracking).
- `sp.mings.az` uses `VITE_APP_SURFACE=sp` (`/` for staff cockpit, plus `/kiosk` and `/kds`).
- Runtime host safety: hostnames take precedence (`order.*` => order surface, `sp.*` => staff surface), so both domains can coexist on one Vercel project.

_Deploy trigger note: this commit contains no functional app changes._
