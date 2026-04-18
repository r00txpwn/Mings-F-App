# Mings F-App — Claude Code Context

## What This Is
Fullstack business management system for a restaurant (mings.az, Baku, Azerbaijan).
Three user surfaces share a single Vite + React 18 + TypeScript codebase:

| Surface | Path | Audience |
|---------|------|----------|
| Staff Cockpit | `/` (sp.mings.az) | Managers — sales, expenses, analytics, inventory |
| Kiosk | `/kiosk` | In-store self-service ordering (Kanban board) |
| KDS | `/kds` | Kitchen Display System — real-time order queue |
| Customer Order | `/order` (order.mings.az) | Public e-commerce ordering |
| Order Tracking | `/track` | Customer order status |

## Tech Stack
- **Frontend:** React 18, TypeScript 5.5, Vite 5, Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Drag & Drop:** @dnd-kit/core (Kiosk Kanban)
- **Payments:** EPoint gateway (Azerbaijan)
- **Delivery:** Wolt Drive integration
- **i18n:** English / Azerbaijani / Russian (src/translations.ts)

## Key Files
- `src/main.tsx` — Entry: routes to correct surface by hostname/path
- `src/App.tsx` — Staff cockpit shell + auth guard
- `src/lib/supabase.ts` — Supabase client + all domain TypeScript interfaces
- `src/translations.ts` — All UI strings for 3 languages
- `src/services/analytics/kpiCalculations.ts` — Pure KPI math (unit-testable)
- `src/services/analytics/validation.ts` — Financial data validation rules
- `src/services/deliveryZones.ts` — Point-in-polygon geo logic
- `supabase/functions/` — 10 Edge Functions (orders, payments, delivery)
- `supabase/migrations/` — 52 SQL migrations

## Architecture Rules
1. Domain surfaces are co-located in `/src/order`, `/src/kiosk`, `/src/kds`
2. Shared UI primitives live in `src/components/ui/`
3. Analytics services are pure (no Supabase calls in `kpiCalculations.ts`)
4. `src/lib/supabase.ts` is the single source of truth for DB types

## QA Focus Areas
When running QA, prioritise:
1. **Financial accuracy** — KPI math, payout reconciliation, margin calculations
2. **Translation completeness** — all 3 languages must have the same keys
3. **Delivery zone logic** — point-in-polygon correctness
4. **TypeScript hygiene** — `tsc --noEmit` must pass with zero errors
5. **Build integrity** — `vite build` must succeed
6. **Edge Function contracts** — function signatures vs caller expectations
7. **Route coverage** — all documented routes still exist in source
8. **Env vars** — `.env.example` keys match `scripts/verify-env.mjs` checks

## Running the Project
```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run qa           # Full QA suite + Claude analysis
```

## Deployment
- Frontend: Vercel or Netlify (static SPA, `dist/`)
- DB + Auth: Supabase cloud project
- Edge Functions: `npm run supabase:sync`

## Documentation
- `APP_STRUCTURE.md` — architecture deep-dive
- `docs/COMBO_DEALS.md`, `docs/DELIVERY_JOURNEY.md` — feature docs
- `docs/URL_ROUTING_AUDIT.md` — routing reference
- `docs/QA_STATUS.md` — **auto-updated by QA agent** (do not edit manually)
