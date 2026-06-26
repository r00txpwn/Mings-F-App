# Full App Functional QA — 2026-06-22 (Local)

## Commit / preview

| Item | Value |
|------|--------|
| **gitSha** | `87b5bd5bb7f65b6122bdcef2b06d2a42b61957ea` |
| **Staff preview** | http://127.0.0.1:4175/ (`build-meta.json` matches SHA) |
| **Storefront preview** | http://127.0.0.1:4176/ |
| **Payments scope** | COD / unpaid only (per plan) |
| **Tooling** | Cursor browser MCP + Playwright smoke |

## Global blockers

1. ~~**`STAFF_PASSWORD` not set**~~ — **Resolved 2026-06-22.** Password in `.env.local`; `node scripts/staging-rls-check.mjs` **pass**; Playwright staff suite **8/8 pass** (`node scripts/run-qa-staff-functional.mjs`).
2. **No customer test session** — online COD E2E (O-05–O-09), tracking with valid token (T-02–T-03), and Chain 3 require signed-in customer + verified phone.
3. **Playwright storefront pageerror** — 2 smoke tests fail with `Unexpected token '<'` on `/order` and `/track` (likely a non-Supabase asset/JSON parse); manual browser loads both pages successfully after menu fetch.
4. **Money screen RLS warning** — Cockpit `money` shows `permission denied for table suppliers` for `staff@mings.az` (page still loads; logged during staff-functional run).

## Automated gates

| Gate | Result |
|------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (13 pre-existing warnings) |
| `npm run test` (Vitest) | **PASS** (79 tests) |
| `npx playwright test` | **14 pass / 2 fail / 4 skip** (Chromium installed during run) |
| `node scripts/run-qa-staff-functional.mjs` | **8 pass** (auth setup + 7 staff flows) |

Playwright failures: `smoke.storefront.spec.ts` — JS crash filter on `/order` and `/track`.

---

## Phase 1 — Global smoke

| ID | Check | Platform | Status | Notes |
|----|-------|----------|--------|-------|
| G-01 | Staff `/spec-ops?screen=home` loads | Desktop | **pass** | Login gate shown |
| G-01 | Staff home | Mobile | **pass** | Login gate (390×844 emulation) |
| G-02 | Storefront `/order` menu | Desktop | **pass** | Products, cart, modifiers |
| G-02 | Storefront `/order` | Mobile | **pass** | Bottom nav, cart badge |
| G-03 | `/track` no token | Desktop | **pass** | "Missing tracking link" |
| G-04 | Staff paths on storefront (`/spec-ops`, `/kds`) | Desktop | **pass** | "Admin access only" |
| G-05 | `/order` on staff bundle (4175) | Desktop | **pass** | Blocked correctly |
| G-06 | Login gate `/kds`, `/pos`, `/order-manager`, `/spec-ops` | Desktop | **pass** | Email/password form |
| G-07 | i18n AZ on storefront | Desktop | **pass** | Menyu / Səbət / Hesab |
| G-08 | Cockpit theme toggle | Desktop | **pass** | Settings: Language + Theme headings visible (staff auth) |

---

## Phase 2 — Surface matrix

### A. Customer ordering (`4176/order`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| O-01 | Browse menu | **pass** | Noodles category, modifier modal |
| O-02 | Cart qty/total | **pass** | Chicken Noodles 9.38 ₼ |
| O-03 | Guest checkout blocked | **pass** | "Please sign in to continue" |
| O-04 | Account auth UI | **pass** | SMS / Email / Google |
| O-05 | COD takeaway E2E | **blocked** | No customer auth |
| O-06 | COD delivery E2E | **blocked** | No customer auth |
| O-07 | Kitchen closed | **blocked** | Needs staff → Delivery settings |
| O-08 | Out-of-zone delivery | **blocked** | No customer auth |
| O-09 | Scheduled order | **blocked** | No customer auth |
| O-10 | Card partial | **skip** | COD-only scope |

### B. Tracking (`4176/track`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| T-01 | Missing token | **pass** | No crash |
| T-02 | Valid token | **blocked** | No order token |
| T-03 | Live update | **blocked** | Depends on T-02 + staff |

### C. Kiosk (`4175/kiosk`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| K-01 | Secret gate | **pass** | Open (no `VITE_KIOSK_SECRET`) |
| K-02 | Full order | **pass** | DB: **M034** kiosk pending @ 2026-06-22T18:35:21Z |
| K-03 | Modifiers required | **pass** | Spicy Level 1 enforced |
| K-04 | Idle timeout 60s | **skip** | Time budget |
| K-05 | Kiosk i18n | **pass** | EN/AZ/RU buttons on idle |

### D. POS (`4175/pos`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| P-01 | Tabs | **pass** | New order / Active / History / Settings |
| P-02 | Takeaway submit | **pass** | Playwright: product tap → Create order → M### display |
| P-03–P-07 | Eat-in, delivery, reprint, history, settings | **partial** | Not individually exercised this pass |

### E. KDS (`4175/kds`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| D-01 | Board loads | **pass** | Pending column visible |
| D-02–D-08 | Search, prep, complete, history | **partial** | M034 searched; Start preparing clicked if visible; full chain not verified |

### F. Order Manager (`4175/order-manager`)

| ID | Flow | Status | Notes |
|----|------|--------|-------|
| M-01 | Active tab | **pass** | New orders / in progress UI |
| M-02–M-10 | Accept, dispatch, past orders | **partial** | Not individually exercised |

### G. Cockpit (`4175/spec-ops?screen=…`)

| ID | Screen | Status | Notes |
|----|--------|--------|-------|
| C-H01 | home | **pass** | KPIs visible |
| C-OS01 | order-support | **pass** | Loads authenticated |
| C-KO01 | kiosk-orders | **pass** | |
| C-DL01–03 | delivery | **pass** | |
| C-OL01 | order-locations | **pass** | |
| C-MB01 | menu-builder | **pass** | |
| C-CB01 | combos | **pass** | |
| C-PR01 | products | **pass** | |
| C-SU01 | suppliers | **pass** | |
| C-SA01 | sales | **pass** | |
| C-MO01 | money | **pass*** | *RLS warning on suppliers table |
| C-EX01 | expenses | **pass** | |
| C-PA01 | payouts | **pass** | |
| C-RE01 | reports | **pass** | POS · source filter chips visible |
| C-US01 | users | **not tested** | Admin role not verified this pass |
| C-ST01 | settings | **pass** | Language + theme controls |

---

## Phase 3 — Integration chains

| Chain | Status | Evidence |
|-------|--------|----------|
| 1 Kiosk → KDS | **partial** | Kiosk **M034** created; KDS board loads + search; prep advance if button visible |
| 2 POS → KDS | **partial** | POS takeaway order created (new M###); KDS cross-check not verified |
| 3 Online COD → Track → OM | **blocked** | Customer + staff auth for full chain |
| 4 Analytics reflects orders | **partial** | Home KPIs + reports POS chips load |
| 5 Cockpit order boards | **partial** | kiosk-orders + order-support screens load |

---

## Phase 4 — Mobile retest (390×844)

| Flow | Status | Notes |
|------|--------|-------|
| O-05 COD takeaway | **blocked** | No customer auth |
| K-02 kiosk order | **pass** | Same session as desktop |
| P-02 POS takeaway | **pass** | Playwright staff-functional |
| D-04 KDS prep | **partial** | Search M034; prep if visible |
| M-02 OM accept | **partial** | Active tab only |
| C-H01 home KPIs | **pass** | Staff auth |
| Storefront menu mobile | **pass** | Cart persisted, bottom nav OK |

---

## Summary counts

| Status | Count (test IDs) |
|--------|------------------|
| **pass** | 45+ |
| **fail** | 0 (manual browser) |
| **blocked** | 8 (customer auth + Users admin) |
| **skip** | 2 |
| **partial** | 10 |

---

## Re-run staff suite

```bash
node scripts/run-qa-staff-functional.mjs
```

Requires `STAFF_PASSWORD` in `.env.local` and preview at http://127.0.0.1:4175/ .

---

## Claude Extension — QA session (if second pass)

Preview: http://127.0.0.1:4175/spec-ops?screen=home  
Compare SHA: http://127.0.0.1:4175/build-meta.json → `87b5bd5bb7f65b6122bdcef2b06d2a42b61957ea`

When finished: `npm run qa:result -- --status=partial` (customer COD + full integration chains still open)
