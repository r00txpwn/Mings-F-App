## Cursor → QA handoff — Cash drawer / reconciliation

**Status:** Migration applied on production (`20260626180000`). Edge functions `admin-api` + `pos-order-create` deployed. Live QA verified on http://127.0.0.1:4175/.

**Commit:** `d118472b3b66fa85d3f119a6823f736a82b66fce`

**Summary**

- **Goal:** a running physical-cash balance so the drawer can be tallied at month end.
- **POS:** new **Cash / Card** toggle on the cart. The choice is stored on the sale (`payment_method`).
- **Mark paid** (Order Manager, Kiosk Orders, Admin Order Support): now stamps `payment_method` (cash unless already card-online) + `paid_at`. Only **cash + paid** orders count toward the drawer.
- **Cash & Debt → Cash drawer tab:** opening balance, cash in / out breakdown, closing balance for a date range, plus a manual **cash movements** ledger (opening float, bank deposit, adjustment) with add/delete.
- **Dashboard:** new **Cash on hand** hero card (all-time closing balance).

**Balance formula (derived + ledger hybrid)**

`opening float + cash orders collected + bank withdrawals (net of fees) − cash expenses − cash supplier payments − cash liability payments − bank deposits ± adjustments`

- Cash in (orders) is derived from `sales` (cash method + `payment_status` paid/completed).
- **Card sales never count toward cash on hand** (that money lands in the bank).
- **Bank withdrawals auto-add to cash on hand as (amount − fee)** — withdrawing pulls physical cash into the drawer; the fee is the cost.
- Cash out is derived from `operational_expenses` / `supplier_account_payments` / `liability_payments` whose `payment_method` reads as cash.
- `cash_movements` holds only opening float, bank deposits (cash→bank), and manual adjustments.

**Backend (applied)**

- Project: `dmrvycswdteuhfydchdr`
- Migration: `20260626180000_cash_drawer_ledger.sql` ✓
- **`admin-api`** + **`pos-order-create`** redeployed ✓

**URLs (local preview after `npm run deploy:local`)**

- POS: `http://127.0.0.1:4175/spec-ops?screen=pos`
- Cash drawer: `http://127.0.0.1:4175/spec-ops?screen=liabilities` → **Cash drawer** tab
- Home KPIs: `http://127.0.0.1:4175/spec-ops?screen=home`

**Scenarios to verify**

1. **POS cash order** — create takeaway with **Cash** selected → order is `unpaid`, not yet in drawer.
2. **Mark paid** — mark that order paid in Order Manager → **Cash on hand** rises by the order total.
3. **POS card order** — create with **Card**; after mark paid it does NOT add to cash.
4. **Opening float** — Cash drawer → add `Opening float` ₼200 (in) → opening/closing reflect it.
5. **Bank deposit** — add `Bank deposit` ₼100 (out) → closing drops ₼100.
   - **Bank withdrawal** — Withdrawals tab: log ₼500 (cashier, ₼2.50 fee) → Cash drawer **Cash on hand** rises ₼497.50 automatically.
6. **Adjustment** — add `Adjustment` in/out → balance moves accordingly; delete it → reverts.
7. **Cash expense** — log a cash expense → cash out increases; closing drops.
8. **Date range** — change range; pre-range activity folds into Opening balance.

**Credentials:** Staff cockpit login (admin or manager).

---

## Claude Extension — QA session

Test the staff cockpit cash drawer on `http://127.0.0.1:4175/spec-ops?screen=…` after `npm run deploy:local`. Confirm `http://127.0.0.1:4175/build-meta.json` `gitSha` matches `git rev-parse HEAD`.

Pass/fail each scenario above. When done: `npm run qa:result -- --issue <ID> --pass`
