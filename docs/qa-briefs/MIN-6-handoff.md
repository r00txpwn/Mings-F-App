## Cursor → QA handoff

> **Claude Extension:** each QA chat starts with **no repo context**. Paste **this entire file** as the **first user message** in a new Extension chat (or use the same text from the Linear comment after `npm run qa:handoff` posts it).

**Status:** ready for second-pass QA

**Last QA feedback (2026-04-22, incorporated here):** second pass was **blocked** on a stale preview (`build-meta.json` still showed an old SHA) and on using **`/?screen=order-support`** instead of **`/spec-ops?screen=order-support`** on localhost. Re-run QA only after a fresh `npm run deploy:local` and `gitSha` match.

**Summary**

**Order Support** (`AdminOrderSupportScreen`) no longer shows a placeholder drawer. Clicking an order opens a side panel with order number, date/time, localized status, customer name and phone, full line items (quantities + modifiers via `OrderItemSummary`), total (and delivery fee when present), delivery address and notes for delivery orders, optional Wolt tracking link, and workflow actions aligned with Order Manager (`sales` updates: Accept / quick 15m prep, Ready, self-dispatch or picked up, Delivered). Scheduled `pending` orders show a hint plus **Go to Order Manager**.

**Files changed**

- `src/screens/AdminOrderSupportScreen.tsx` — drawer UI, `data-order-row` / `data-testid` hooks, `loadOrders` return value for refresh-after-action
- `src/translations.ts` — `orderSupportOrderActions`, `orderSupportPrepareQuick`, `orderSupportScheduledHint` (en/az/ru); removed unused `orderSupportDrawerComingSoon`
- `tests/screenshots/verify-fix.spec.ts` — MIN-6 verification uses `[data-order-row]` and drawer test ids
- `docs/TECHNICAL_SYSTEM_SUMMARY.md`, `docs/URL_ROUTING_AUDIT.md`

**Surfaces / URLs to test**

- **Production (admin host):** `https://sp.mings.az/?screen=order-support` (cockpit loads on the `sp` hostname; query selects the screen).
- Path from nav: Operations area → **Order Support** (same screen).
- **Local / path-only preview (important):** the staff cockpit is mounted only at the **resolved admin path** (default **`/spec-ops`**, from `getResolvedAdminPath()` / `VITE_ADMIN_APP_PATH`). Use:

  **`http://127.0.0.1:4175/spec-ops?screen=order-support`**

  Do **not** use `http://127.0.0.1:4175/?screen=order-support` — on localhost, `/` is **not** the admin shell (you may see “Admin access only” / `PublicNotFound` behavior without Order Support).

**Build integrity (blocking for QA)**

1. **Commit** the MIN-6 changes and ensure your working tree matches what you will build (`git status` clean or intentional).
2. From **repo root**, run **`npm run deploy:local`** (runs `vite build` + writes `dist/build-meta.json` + preview).
3. Open **`http://127.0.0.1:4175/build-meta.json`**. The `gitSha` value **must** equal **`git rev-parse HEAD`** on the machine that ran the build. If it still shows an **older** SHA (e.g. a prior MIN-9-only commit), the preview is **stale** — stop and fix the build before QA.
4. Optional: confirm the main bundle no longer embeds the old placeholder string `orderSupportDrawerComingSoon` if you need extra proof the new `translations.ts` shipped.

**Scenarios to verify**

1. **Drawer content (blocking)** — With at least one order in the table for the selected date range, click a row (`[data-order-row]`). The drawer (`[data-testid="order-support-drawer"]`) must show: order **#**, **time/date**, **status** (human-readable, not raw enum if localized), **customer** block, **line items** with quantities and modifier lines where applicable, **total** in ₼, and **no** raw translation key like `orderSupportDrawerComingSoon` anywhere.
2. **Delivery order** — If a row is `online_delivery` with an address, the drawer shows **delivery address** (and delivery notes if present). Wolt **tracking** link appears only when `delivery_orders.tracking_url` exists.
3. **Actions smoke (non-production preferred)** — On a **test** order only: from `pending` (not scheduled), **Accept** or **Prepare (15 min)** moves to **preparing**; **Ready** → **ready**; for takeaway/kiosk **Picked up** → **completed**; for delivery after ready, **Confirm self dispatch** → **dispatched**, then **Delivered** → **completed**. Skip or use read-only if you cannot mutate production data.
4. **Scheduled pending** — Order with `scheduled_for` while `pending`: drawer shows the **scheduled hint** and a control that opens **Order Manager** (`/order-manager` on the order host); workflow buttons for accept/prepare must **not** apply the normal new-order accept path incorrectly (hint is primary).
5. **Terminal states** — `completed` / `cancelled` rows: drawer shows details; **no** primary action strip (read-only).

**Known constraints / fixtures**

- Cockpit **staff/admin** login (same accounts you use for `sp.mings.az`).
- You need **orders** in `sales` for the chosen **date range** and filters (kiosk / online_delivery / online_takeaway); empty list means scenario 1 cannot be exercised until data exists.
- Viewports: desktop and ~393px width if possible.

**Screenshots from Cursor verification (optional)**

- `screenshots/fixes/MIN-6/01-drawer.png` after local smoke (create folder if capturing).

**Commit** (Cursor session — filled for QA)

- **Branch:** `session/2026-04-22-cursor-session`
- **SHA:** after `git checkout` + `git pull` on this branch, run **`git rev-parse HEAD`** — it **must** match `http://127.0.0.1:4175/build-meta.json` → `gitSha` immediately after **`npm run deploy:local`** on that same checkout (do not trust a stale SHA copied from an earlier message).
- **Deployed:** `sp.mings.az` — no (local QA only until you merge / deploy).

---

## Claude Extension — QA session (fresh context)

You are performing **second-pass QA** for **Ming’s OS** (Vite + React + TypeScript storefront and staff apps, Supabase backend). You do **not** have the codebase unless the user attached it — rely on this handoff and the Linear issue.

### Linear

- **Issue:** MIN-6
- **Issue URL:** https://linear.app/mingsaz/issue/MIN-6/admin-ordersupport-drawer-is-a-placeholder
- **Expected label:** `qa:ready` after Cursor runs `qa:handoff` (if not, note the actual label before testing).

### What was implemented (short)

Order Support drawer shows full order details and staff actions instead of placeholder copy; aligns with Order Manager `sales` workflow updates.

### Where to test

- `https://sp.mings.az/?screen=order-support`
- **`http://127.0.0.1:4175/spec-ops?screen=order-support`** after `npm run deploy:local` — **not** `/?screen=…` on localhost (admin shell defaults to `/spec-ops`).
- Before any UI verdict: **`http://127.0.0.1:4175/build-meta.json`** → `gitSha` must equal `git rev-parse HEAD` for the repo you built (otherwise the MIN-6 fix is not in the bundle).

### Credentials / fixtures

- Staff or admin account with access to the **cockpit** (`sp.mings.az` or local admin path).
- Orders visible in the list for the **selected dates**; adjust date picker if the table is empty.

### Scenarios (check each pass/fail; do not skip)

Mirror the numbered scenarios in the **Cursor → QA handoff** section above (drawer content, delivery row, optional action smoke, scheduled hint, terminal read-only).

### Evidence to collect

- Per-scenario pass/fail, browser + viewport, console/network errors if any.
- Screenshots optional unless the team asked.

### When you are done — record the result (fresh context safe)

1. Write markdown matching **Template B** in `docs/QA_COMMENT_TEMPLATES.md`.
2. From **repo root**, with `LINEAR_API_KEY` or `.env.local`:

   `npm run qa:result -- --issue=MIN-6 --status=pass --result-file=<path-to-template-b.md>`

   Use `fail` or `blocked` if appropriate. On **pass**, this also sets Linear **Done** (completed workflow) unless `--no-resolve` was added.

3. If you cannot run the CLI, paste Template B as a new Linear comment and ask a human to run `npm run qa:result` with that body in a file.

### Guardrails

- Do **not** push to `main` or change git remotes; QA only.
- Prefer **local preview** or a **staging** host for destructive action tests; avoid mutating real customer orders on production without approval.

### Reference doc (human / Cursor)

`docs/QA_COMMENT_TEMPLATES.md` — Templates A and B and agent rules.

---

## Claude Extension — continue QA (copy-paste after Cursor ran `npm run deploy:local`)

Use this block **after** the human or Cursor has run **`npm run deploy:local`** from the repo that contains the SHA below.

```markdown
## MIN-6 — continue second-pass QA (local preview)

**Build identity**
- Branch: `session/2026-04-22-cursor-session`
- Expected `gitSha`: run **`git rev-parse HEAD`** on that branch after pull — must match `http://127.0.0.1:4175/build-meta.json` after `npm run deploy:local`.

**Steps**
1. Open `http://127.0.0.1:4175/build-meta.json` — confirm `gitSha` equals the value above. If not, stop (stale `dist/` or wrong repo).
2. Sign in to the cockpit, then open **`http://127.0.0.1:4175/spec-ops?screen=order-support`** (not `/?screen=…`).
3. Run the scenarios in this file (drawer content, delivery, actions, scheduled hint, terminal).
4. Record the result: save Template B to a file, then from repo root:  
   `npm run qa:result -- --issue=MIN-6 --status=pass|fail|blocked --result-file=<path>`  
   (`pass` moves the Linear issue to Done + `qa:passed` unless you add `--no-resolve`.)
```
