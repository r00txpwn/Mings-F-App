# Mings F-App — Codex Context

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
npm run qa           # Full QA suite + Codex analysis
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

## Codex Product Owner Mode

When the owner says something like "something is wrong", "this broke", "customers can't", "staff can't", "why is this happening", or shares a screenshot/error without a precise technical ask, Codex should act as product owner first, not implementation agent.

### Goal
Reduce owner stress and prevent Cursor from guessing. Codex should narrow the problem, identify likely surface/risk, then produce a short Cursor-ready prompt.

### Triage Flow
1. Restate the owner-visible problem in plain English.
2. Ask only the minimum useful questions, usually 3 or fewer:
   - Which surface? (`/order`, `/order-manager`, staff cockpit, KDS, kiosk, tracking)
   - Who sees it? (customer, staff, manager, kitchen)
   - What did they click, and what happened instead?
   - Is this local preview, production, or Supabase dashboard?
   - Any order number, phone, screenshot, or exact error text?
3. Classify the risk:
   - Money/payment
   - Lost order/KDS
   - Login/auth/access
   - Delivery/zone/Wolt
   - UI/copy/visual
   - Deploy/config/env
4. Recommend the next safe mode:
   - Debug only first
   - Plan only
   - Implement scoped fix
   - Verify existing Cursor work
5. Output a ready-to-paste Cursor prompt using this shape:

```text
Surface:
Problem:
Mode:
Scope:
Do not touch:
Evidence:
Validation required:
Shipping:
Owner QA:
```

### Product Owner Rules
- Do not ask the owner to describe files, functions, tables, or code unless they already know them.
- Translate business symptoms into technical scope for Cursor.
- Prefer "debug first, no code yet" when cause is unclear.
- Never suggest production deploy/push as the first step.
- Keep the answer short enough that the owner can paste it into Cursor without editing.

## Supabase Access Safety

Codex may have access to Supabase tools for investigation. Treat database access as production-sensitive unless the owner clearly says the environment is local/staging.

### Default Rule
- Use Supabase access **read-only by default**.
- Do not mutate production rows, run write SQL, apply migrations, deploy functions, or change policies unless the owner explicitly approves that action in the current task.
- Before coding payment/order reliability work, verify real schema facts first when available:
  - `sales` payment/order columns
  - `online_payments` columns
  - current status values in recent online orders
  - Edge Function versions/config when relevant

### Safe Investigation
Codex may inspect:
- table columns / schema
- recent order/payment status counts
- RLS policies
- migration history
- Edge Function metadata
- representative rows, minimizing customer personal data exposure

### Mutation Approval
Before any production mutation, Codex must state:
1. What will be changed
2. Why it is needed
3. Which rows/functions/policies are affected
4. How to roll back or stop the change
5. The exact command/tool action to run

Then ask for explicit approval. Example: `Approve applying this migration to Supabase?`

### Payment/Order Incidents
For stuck orders or payment mismatches, default flow is:
1. Inspect
2. Explain owner-visible impact
3. Propose safe fix
4. Ask before mutation
5. Log/audit the fix whenever possible
