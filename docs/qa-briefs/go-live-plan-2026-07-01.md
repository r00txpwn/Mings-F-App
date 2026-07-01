# Go-live plan — start using Ming's OS (July 2026)

**Goal:** Run daily restaurant ops today (staff cockpit, POS, Kiosk, KDS, Order Manager) with stable order + finance flows.

**Build under test:** `http://127.0.0.1:4175/` (staff) · commit `86ec2c8…` + session fixes below.

---

## Today — use these surfaces

| Surface | URL | Use for |
|---------|-----|---------|
| Staff cockpit | `http://127.0.0.1:4175/spec-ops?screen=home` | Sales, expenses, payouts, reports, menu, delivery dispatch |
| POS | `http://127.0.0.1:4175/pos` | In-store eat-in / takeaway / delivery orders |
| Kiosk | `http://127.0.0.1:4175/kiosk` | Self-service (use **logged-out** browser or incognito — staff session blocks checkout) |
| KDS | `http://127.0.0.1:4175/kds` | Kitchen queue |
| Order Manager | `http://127.0.0.1:4175/order-manager` | Accept, prep, ready, dispatch, menu toggles |

**Manual partner sales (Wolt/Bolt/ChoiceQR):** cockpit → Sales — already verified for June MTD.

**Defer for week 1:** full online checkout in browser (SMS OTP), EPoint webhook automation, live Wolt API dispatch.

---

## Fixes in this session (code)

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | OM menu toggles / admin mutations hang | `adminApi.ts` — persisted JWT + `fetch` to edge functions |
| P0 | Dispatch “Mark manual” missing URL | `DispatchTab.tsx` — prompt + send `trackingUrl` |
| P0 | POS orders labeled “Kiosk” in OM | Shared `orderSourceLabel()` helper |
| P0 | Confirm payment only on `pending` | `needsStaffPaymentConfirmation()` — OM + Order Support |
| P1 | Track page stale until reload | Polling fallback on `:4176/track` |
| P1 | Manual dispatch upsert fails on fresh DB | Migration: `UNIQUE (sale_id)` on `delivery_orders` |

---

## Before first production shift (owner checklist)

1. **`npm run deploy:local`** (or ship frontend via your normal PR → Vercel flow).
2. **`npm run supabase:push`** — apply pending migrations (`completed_at`, tracking RPC, `delivery_orders` unique).
3. **Staff login:** `admin@system.local` (or your manager account) on cockpit + OM.
4. **Kiosk:** dedicated device or incognito — do not stay logged into cockpit on same tab.
5. **Opening balances:** verify Home → bank / card / cash match real drawer.
6. **Kitchen hours:** Settings → online hours (OM shows “Closed by hours” outside window — expected).

---

## Week 1 follow-ups

| Item | Owner action |
|------|----------------|
| Online ordering | Configure Supabase test phone or disable SMS OTP for staging; then A-ONLINE COD |
| Card payments | EPoint secrets + webhook URL in Supabase |
| Wolt dispatch | Wolt Drive credentials; test F-DEL-08 on one order |
| Products screen | Retest add/edit after X-BUG-05 fix (`master_category_id`) |
| Sandbox cleanup | Only after you say *“clean up E2E test data”* — see COV-02 manifest in ledger |

---

## Known limitations (not blocking day 1)

- Track page may need reload once if realtime is slow (polling mitigates).
- E2E-prefixed rows hidden in some cockpit lists (`isTestRecord`) — use date filters or SQL for audit.
- Print agent optional (`127.0.0.1:9310`) — reprint works when service is running.

---

## Validation after deploy

```bash
npm run typecheck
npm run lint
npm run deploy:local
```

Open `http://127.0.0.1:4175/build-meta.json` — confirm `gitSha` matches your commit.

Smoke: POS order → KDS → OM accept → ready → complete; cockpit Home MTD loads; OM Menu Editor kiosk toggle flips.
