# E2E testing policy — Chrome DevTools MCP only

**Status:** Mandatory for all agents and human QA runs  
**Last updated:** 2026-06-30

---

## Rule

**Every functional E2E test in Ming's OS MUST be executed via Google Chrome DevTools MCP** (`user-chrome-devtools` in Cursor).

This is the **only** approved driver for:

- Creating or editing data through the UI (sales, expenses, menu, payouts, etc.)
- Walking order flows (POS, kiosk, online, KDS, order-manager)
- Pass/fail evidence (screenshots, network/console inspection)
- The [June 2026 month simulation](./june-2026-e2e-daily-scenario.md)
- The [functional E2E master catalog](./functional-e2e-master-catalog.md)

---

## Required MCP server

| Item | Value |
|------|-------|
| **MCP server id** | `user-chrome-devtools` |
| **What it is** | Real visible Chrome controlled via CDP (Chrome DevTools Protocol) |
| **Why** | Matches production browser behavior; captures real network errors (403, 400), auth, and UI state |

Enable in Cursor: **Settings → MCP → `user-chrome-devtools`** must be connected before starting any E2E session.

---

## Not allowed as E2E drivers

| Tool | Why excluded |
|------|----------------|
| **Playwright** (`npm run test:e2e`, scripts) | Does not satisfy the Chrome DevTools MCP requirement for manual/catalog E2E |
| **Cursor embedded browser** (`cursor-ide-browser`) | Not Chrome DevTools MCP — do not substitute for catalog or month-simulation runs |
| **Direct Supabase SQL inserts** for UI flows | OK for **read-only verification** after a UI write; never replace the UI action itself |
| **curl / Postman** for staff cockpit CRUD | Edge/webhook boundary tests only (Group I); not for screen workflows |

Unit tests (`npm run test`) and read-only SQL checks remain fine alongside E2E.

---

## Standard workflow (every test case)

1. **Preflight:** `npm run env:sandbox` → `npm run deploy:local` (+ `:storefront` when online/track needed).
2. **Confirm build:** `http://127.0.0.1:4175/build-meta.json` `gitSha` = `git rev-parse HEAD`.
3. **Chrome DevTools MCP:** `navigate` → `snapshot` / DOM query → `click` / `fill` → `screenshot`.
4. **Ledger:** append row to [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md).
5. **Verify (optional):** Supabase MCP `execute_sql` read-only to confirm the write.

Reference run: [functional-e2e-phase-chrome-results.md](./functional-e2e-phase-chrome-results.md).

---

## Environment

- **Database:** Sandbox_mings_os (`glpdpkozvmfzgoewquxi`) — not production.
- **Staff preview:** `http://127.0.0.1:4175/spec-ops?screen=…` (or ngrok staff URL).
- **Storefront:** `http://127.0.0.1:4176/order` when customer flows are in scope.
- **Prefix:** `E2E-YYYYMMDD-…` on all created labels; ledger everything; delete nothing until owner approves cleanup.

---

## Docs that reference this policy

- [functional-e2e-test-ledger.md](./functional-e2e-test-ledger.md)
- [functional-e2e-master-catalog.md](./functional-e2e-master-catalog.md)
- [june-2026-e2e-daily-scenario.md](./june-2026-e2e-daily-scenario.md)
- [full-app-smoke-usecases.md](./full-app-smoke-usecases.md)
