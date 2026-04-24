## Cursor → QA handoff

> **Claude Extension:** each QA chat starts with no repo context. Paste **this entire file** as the first user message (or copy the same text from the newest Linear comment on MIN-9 after `qa:handoff`).

**Status:** second-pass QA **passed** (2026-04-22). Scenario 1 confirmed on a build verified via `build-meta.json`; ready to merge to the release branch per team process.

**Summary**

Order Manager bottom nav hid the **Menu Editor** tab for users whose `public.users.role` is `staff`. Admins and managers still see all three tabs (Active, Past, Menu Editor). If a disallowed user somehow had `menu` selected, they are reset to Active Orders.

**Files changed** (implementation + local QA ergonomics)

- `src/order-manager/OrderManagerApp.tsx` — Menu Editor gated on a direct `users.role` read; pessimistic reset while fetching.
- `src/contexts/AuthContext.tsx` — Session apply sequencing so stale `fetchStaffState` cannot overwrite `staffRole`.
- `src/lib/staffRole.ts` — Shared `parseStaffRole` / admin-manager check.
- `scripts/write-build-meta.mjs` + `package.json` `deploy:local` — emit `dist/build-meta.json` after each build for preview verification.
- `tests/screenshots/verify-fix.spec.ts` (MIN-9 check: staff login, assert no Menu Editor button)
- `docs/URL_ROUTING_AUDIT.md` (routing notes for tab visibility)

**Surfaces / URLs to test**

- `https://order.mings.az/order-manager` (after your deploy includes this commit)
- Optional local: `http://127.0.0.1:4175/order-manager` — from **repo root** run `npm run deploy:local`, then open `http://127.0.0.1:4175/build-meta.json` and confirm `gitSha` matches `git rev-parse HEAD` (proves the preview is serving the `dist/` you just built, not an old bundle).

**Scenarios to verify**

1. **Staff** — Sign in as `staff@mings.az` (password). Bottom nav must show exactly **two** tabs (Active Orders, Past Orders). There must be **no** button whose accessible name matches “Menu Editor” (EN) / localized equivalent.
2. **Admin or manager** — Sign in as a user with `public.users.role` `admin` or `manager`. Bottom nav must show **three** tabs including Menu Editor; tapping Menu Editor opens the menu editor panel.
3. **Regression** — Staff can still switch between Active and Past and use order workflow on Active tab (smoke only).

**Known constraints / fixtures**

- Auth: `staff@mings.az` + password (same as Playwright `STAFF_PASSWORD` for first-pass verify).
- Second account needed for scenario 2: any admin/manager with Order Manager access.
- Viewports: at least mobile width (393) and desktop; layout uses `grid-cols-2` vs `grid-cols-3`.

**Screenshots from Cursor verification**

- `screenshots/fixes/MIN-9/01-bottom-nav.png` (after `npm run verify:fix` with `ISSUE=MIN-9` and `STAFF_PASSWORD` set)

**Commit / deploy**

- Second-pass QA succeeded on the **confirmed** local preview (`build-meta.json` `gitSha` matched workspace `HEAD` at test time).
- Production (`order.mings.az/order-manager`): **still only fixed after** your release branch merge + normal deploy — confirm `build-meta` equivalent (deploy SHA / Vercel build) if you need traceability there.

---

## Claude Extension — QA session (fresh context)

You are performing **second-pass QA** for **Ming's OS** (Vite + React + TypeScript storefront and staff apps, Supabase backend). You do **not** have the codebase in context unless the user attached it — rely only on this message and the linked Linear issue.

### Linear
- **Issue:** MIN-9
- **Issue URL:** https://linear.app/mingsaz/issue/MIN-9/order-manager-menu-editor-tab-visible-to-staff
- **Expected label (archive):** second pass recorded **pass** 2026-04-22; Linear should move to `qa:passed` (or your team’s equivalent) via `npm run qa:result` when posting to Linear.

### What was implemented (short)
Order Manager hides the **Menu Editor** bottom-nav tab for `public.users.role === 'staff'`; admin and manager still see all three tabs. Staff stuck on menu tab are moved to Active Orders.

### Where to test
- `https://order.mings.az/order-manager` (only after deploy includes this change)
- `http://127.0.0.1:4175/order-manager` after `npm run deploy:local` from repo root if production is not updated — verify `http://127.0.0.1:4175/build-meta.json` first (`gitSha` must match this repo’s `git rev-parse HEAD`).

### Credentials / fixtures
- **Staff path:** `staff@mings.az` + password (team vault / same as local `STAFF_PASSWORD` for Playwright).
- **Admin/manager path (scenario 2):** any account with `public.users.role` `admin` or `manager` and Order Manager access.
- Viewports: try at least ~393px width and desktop.

### Scenarios (check each pass/fail; do not skip)
1. **Staff** — After login, bottom nav shows exactly **two** tabs; no **Menu Editor** button (EN or localized name).
2. **Admin/manager** — Three tabs including Menu Editor; Menu Editor opens the editor panel.
3. **Regression** — Staff can switch Active ↔ Past and Active orders UI still loads (smoke).

### Evidence to collect
- Per-scenario pass/fail, console/network errors if any, browser + approximate viewport.
- Optional screenshots if requested by the team.

### When you are done — record the result (fresh context safe)
1. Write markdown matching **Template B** in repo file `docs/QA_COMMENT_TEMPLATES.md`.
2. From repo root:  
   `npm run qa:result -- --issue=MIN-9 --status=pass --result-file=<path>`  
   (or `fail` / `blocked`). Use `LINEAR_API_KEY` env or `.env.local`.
3. If you cannot run CLI, paste Template B as a new Linear comment and ask a human to run `npm run qa:result` with that body in a file.

### Guardrails
- Do **not** push to `main` or change git remotes; QA only.
- Do not assume production has the fix until the handoff / deploy notes say so.

### Reference doc (human / Cursor)
`docs/QA_COMMENT_TEMPLATES.md` — Templates A and B and agent rules.
