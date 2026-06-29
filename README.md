Mings-F-App

## Local production preview

**Staff bundle (cockpit, KDS, order-manager):**

```bash
npm run deploy:local
```

Serves **`dist-staff/`** on **http://127.0.0.1:4175/** — cockpit at **`/spec-ops`**. Stops any process already on port **4175** first (`--strictPort`; no fallback port).

**Staff bundle on the LAN (access from other devices):**

```bash
npm run deploy:local:lan
```

Same single-port (**4175**), single-instance build, but binds to **`0.0.0.0`** so other devices on the same network can open it. The command prints both a **hostname URL** and the detected **IP URL**:

- **Stable (recommended):** `http://<PC-NAME>:4175/` — survives router/DHCP IP changes, so it stays the same over time.
- **By IP:** `http://<your-lan-ip>:4175/` — works but the IP can change when the DHCP lease renews.

For a permanently fixed IP, set a **DHCP reservation** on your router for this PC. If a device cannot connect, allow inbound TCP **4175** in Windows Firewall (one-time):

```powershell
New-NetFirewallRule -DisplayName "Mings local preview 4175" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4175
```

> LAN access is more reliable than a public tunnel (no third-party server to drop the connection), but both devices must be on the **same network**.

**Remote access from any network (public tunnel via ngrok):**

```bash
npm run tunnel:ngrok
```

Exposes the local preview at a **fixed** public URL that never changes:

- **Cockpit:** `https://putt-context-lazily.ngrok-free.dev/spec-ops?screen=home`

Keep both the app (`npm run deploy:local:lan` or `deploy:local`) **and** the tunnel running. Notes:

- One-time setup: install ngrok, then `ngrok config add-authtoken <token>` (token is **not** stored in the repo). Domain is set in [`scripts/tunnel-ngrok.mjs`](scripts/tunnel-ngrok.mjs) via `NGROK_DOMAIN` (default `putt-context-lazily.ngrok-free.dev`).
- Only run **one** tunnel at a time — ngrok rejects a second connection to the same domain (`ERR_NGROK_334`), which also confirms a tunnel is already live.
- First visit may show a one-click ngrok **“Visit Site”** page (normal; no password).
- This replaces the old localtunnel flow (`npm run tunnel`), which cycled random URLs and is no longer the preferred path.

**Dev (hot reload):**

```bash
npm run dev:staff
```

**http://127.0.0.1:5173/spec-ops** — also kills port **5173** before start.

**Storefront bundle (customer order + track):**

```bash
npm run deploy:local:storefront
```

Serves **`dist-storefront/`** on **http://127.0.0.1:4176/** — menu at **`/order`** or **`/`** on order host. Stops any process on **4176** first.

**Dev:** `npm run dev:storefront` → **http://127.0.0.1:5174/order**

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

## Architecture

- **Technical spec & architecture:** **[docs/TECHNICAL_SPEC_AND_ARCHITECTURE.md](docs/TECHNICAL_SPEC_AND_ARCHITECTURE.md)** — surfaces, data model, Edge Functions, deploy topology, security

## Feature docs

- Combo deals: **[docs/COMBO_DEALS.md](docs/COMBO_DEALS.md)**
- Delivery journey: **[docs/DELIVERY_JOURNEY.md](docs/DELIVERY_JOURNEY.md)**
- Payroll (Staff & Salaries): **[docs/TAXES_PAYROLL.md](docs/TAXES_PAYROLL.md)** — Taxes screen removed 2026-06-29; log tax as operational expenses
- United Payment (card checkout): **[docs/UNITED_PAYMENT_INTEGRATION.md](docs/UNITED_PAYMENT_INTEGRATION.md)**
- Kitchen hours / pause / soft-close: **[docs/KITCHEN_HOURS.md](docs/KITCHEN_HOURS.md)**
- Reliability / manual QA focus: **[docs/RELIABILITY_QA_PRIORITIES.md](docs/RELIABILITY_QA_PRIORITIES.md)**
- Automated test plan (living spec): **[docs/TEST_PLAN.md](docs/TEST_PLAN.md)** — gaps diffed by `npm run qa:plan` and included in `npm run qa` reports

## Testing workflow

**PR gate (required):** GitHub Actions [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and push to `main`:

- `npm run typecheck`
- `npm run lint`
- `npm run build:staff`
- `npm test`

**On demand (full QA + report):**

```bash
npm run qa          # gates + test-plan diff → docs/QA_STATUS.md
npm run qa:plan     # advisory: diff TEST_PLAN.md vs repo only
npm run test:e2e    # Playwright smoke (local preview on 4175/4176)
```

**Scheduled:** [`.github/workflows/qa-agent.yml`](.github/workflows/qa-agent.yml) runs twice daily — full build, E2E, AI analysis, updates `docs/QA_STATUS.md`.

**Cursor:** say **"test initiate"** for desktop + mobile smoke per `.cursor/rules/test-initiate-web-desktop-mobile.mdc`.

Edit **[docs/TEST_PLAN.md](docs/TEST_PLAN.md)** when adding scope; check boxes only after real tests land. Do not edit **[docs/QA_STATUS.md](docs/QA_STATUS.md)** by hand.

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
