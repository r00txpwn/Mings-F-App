Mings-F-App

## Local production preview

**Staff bundle (cockpit, KDS, order-manager):**

```bash
npm run deploy:local
```

Serves **`dist-staff/`** on **http://127.0.0.1:4175/** — cockpit at **`/spec-ops`**.

**Storefront bundle (customer order + track):**

```bash
npm run deploy:local:storefront
```

Serves **`dist-storefront/`** on **http://127.0.0.1:4176/** — menu at **`/order`** or **`/`** on order host.

Each build writes **`build-meta.json`** with `gitSha` and `buildTarget`. Confirm SHA before QA.

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for the **two-project** Vercel split (`order.mings.az` + `sp.mings.az`). Builds: `npm run build:staff` / `npm run build:storefront`.

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
- United Payment (card checkout): **[docs/UNITED_PAYMENT_INTEGRATION.md](docs/UNITED_PAYMENT_INTEGRATION.md)**
- Kitchen hours / pause / soft-close: **[docs/KITCHEN_HOURS.md](docs/KITCHEN_HOURS.md)**
- Reliability / manual QA focus: **[docs/RELIABILITY_QA_PRIORITIES.md](docs/RELIABILITY_QA_PRIORITIES.md)**

## Issue loop tooling

- Verify a specific Linear fix with Playwright: `npm run verify:fix -- --issue=MIN-12`
- Hand off a fix to second-pass QA (Claude Chrome Extension): `npm run qa:handoff -- --issue=MIN-12 --brief-file=<path>`
  - Applies label `qa:ready`, clears other `qa:*` labels, posts the Cursor → QA comment.
  - **Before running `qa:handoff`,** write `docs/qa-briefs/<ISSUE>-handoff.md` (see `docs/qa-briefs/MIN-6-handoff.md`, `MIN-9-handoff.md`, `MIN-10-handoff.md`) including the full **Claude Extension — QA session** block so Extension testers have explicit URLs, scenarios, and `qa:result` steps without repo access.
- Record a QA result (invoked by Claude Extension or manually): `npm run qa:result -- --issue=MIN-12 --status=pass --result-file=<path>` — on **pass**, Linear gets `qa:passed`, your comment, **and** the issue is moved to the team’s **completed** (Done) workflow state (same API as Linear MCP would use). Pass **`--no-resolve`** to set only the label + comment.
  - Statuses: `pass`, `fail`, `blocked`. Applies `qa:passed` / `qa:failed` / `qa:blocked` and clears the rest.
- Close a Linear issue from the CLI after QA passes: `npm run close:issue -- MIN-12`
  - Refuses without label `qa:passed` or without `--force`.
  - Urgent and High priority issues require `--force` as an extra human check.
- All three scripts need `LINEAR_API_KEY` (shell or `.env.local` in repo root — if the key is missing in the environment, the scripts merge unset keys from `.env.local` without overriding your shell).
- Comment templates + **Claude Extension fresh-context prompts** (handoff + result): **[docs/QA_COMMENT_TEMPLATES.md](docs/QA_COMMENT_TEMPLATES.md)**.

Domain-rooted routing:
- `order.mings.az` uses `VITE_APP_SURFACE=order` (`/` for customer ordering, `/track` for tracking, `/order-manager` for staff ops).
- `sp.mings.az` uses `VITE_APP_SURFACE=sp` (`/` for staff cockpit, plus `/kiosk`, `/kds`, and `/order-manager`).
- Runtime host safety: hostnames take precedence (`order.*` => order surface, `sp.*` => staff surface), so both domains can coexist on one Vercel project.
