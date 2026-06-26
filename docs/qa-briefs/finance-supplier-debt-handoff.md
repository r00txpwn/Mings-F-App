## Cursor → QA handoff

**Status:** Implementation complete; production DB + `admin-api` deployed. Frontend needs merge/deploy to production staff host.

**Summary**

Supplier debt as a running account (opening balance + on-credit purchases − lump payments), FIFO display badges, Cash & Debt screen (loans/other + bank withdrawals), and Net Profit KPI (`operatingProfit − bankFees`). Payments reconciliation screen (phase 1) included in same branch.

**Production backend (already applied)**

- Project: `dmrvycswdteuhfydchdr` (`https://dmrvycswdteuhfydchdr.supabase.co`)
- Migration `20260626150000` DDL applied manually (history was drifted; tables now exist)
- `admin-api` redeployed with allowlist for `supplier_account_payments`, `liabilities`, `liability_payments`, `bank_withdrawals`

**Commit**

- Branch: `session/2026-06-26-finance-supplier-debt`
- SHA: `9cecd0becc4a748f47e8a931388adba0fb25a6fb`

**Surfaces / URLs to test (local preview)**

From repo root: `npm run deploy:local` → verify `http://127.0.0.1:4175/build-meta.json` `gitSha` matches `git rev-parse HEAD`.

- Home KPIs: `http://127.0.0.1:4175/spec-ops?screen=home`
- Suppliers (opening balance, pay supplier, FIFO): `http://127.0.0.1:4175/spec-ops?screen=suppliers`
- Cash & Debt: `http://127.0.0.1:4175/spec-ops?screen=liabilities`
- Payments reconciliation: `http://127.0.0.1:4175/spec-ops?screen=payments`

**Scenarios to verify**

1. **Opening balance** — Set supplier opening balance ₼1200 on Suppliers screen; outstanding shows ₼1200.
2. **On-account purchase** — Log purchase as On account; outstanding increases; COGS still counts purchase.
3. **Lump payment** — Pay supplier ₼500; outstanding decreases; FIFO badges update (no per-invoice marking).
4. **Bank withdrawal** — Log cashier withdrawal; fee appears; Home Net Profit = operating profit − fees.
5. **Regression** — Operating profit unchanged when no withdrawals; Kiosk/order payment flows unaffected.

**Credentials**

Staff cockpit login required (Google or email/password). Use admin or manager account.

---

## Claude Extension — QA session (fresh context)

You are performing **second-pass QA** for Ming's OS finance debt features on the **staff cockpit** (`spec-ops`).

### Where to test
- Local: `http://127.0.0.1:4175/spec-ops?screen=…` after `npm run deploy:local`
- Confirm `http://127.0.0.1:4175/build-meta.json` `gitSha` matches repo `git rev-parse HEAD`

### Scenarios (pass/fail each)
1. Supplier opening balance → outstanding
2. On-account purchase → outstanding + COGS
3. Lump supplier payment → FIFO badges
4. Bank withdrawal → Net Profit KPI
5. Regression: no bank fees → net profit equals operating profit

### When done
From repo root:
```bash
npm run qa:result -- --issue <ISSUE-ID> --pass
```
