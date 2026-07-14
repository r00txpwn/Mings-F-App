# June 2026 E2E Daily Simulation — Sandbox

**Environment:** Sandbox_mings_os (`glpdpkozvmfzgoewquxi`) only  
**Driver (mandatory):** **`user-chrome-devtools` MCP** — [E2E_CHROME_DEVTOOLS_POLICY.md](./E2E_CHROME_DEVTOOLS_POLICY.md)  
**Staff preview:** `http://127.0.0.1:4175` or ngrok `https://putt-context-lazily.ngrok-free.dev`  
**Storefront:** `http://127.0.0.1:4176` (online/track days)  
**Prefix:** `E2E-202606XX-<short>` on all names/notes  
**Ledger:** append every row to [`functional-e2e-test-ledger.md`](./functional-e2e-test-ledger.md)

---

## Owner confirmations (locked)

| # | Rule | Plan |
|---|------|------|
| 1 | ChoiceQR always **cash** | All ChoiceQR payouts `received_account=cash` |
| 2 | Include POS / Kiosk / Online flows | Yes — see channel table below |
| 3 | Opening balance **₼1000** | Main **bank** opening balance ₼1000 on Jun 1 (card ₼0 until transfers) |
| 4 | Full June payroll | All staff paid period **Jun 1–30** on Jun 22; joiner **Jun 15–30** on Jun 15 |
| 5 | Minor liabilities | Total new principal in June **≤ ₼5000** (see liability schedule) |
| 6 | Menu priority | **8 items** from live [Wolt Ming's menu](https://wolt.com/en/aze/baku/restaurant/mings) — **Jun 1 first** |
| 7 | No OTP / Google (sandbox) | **Do not** use SMS OTP or Google OAuth; email/password sandbox customer only for online |
| 8–10 | Order lifecycle, edit/delete, system screens | Included in daily schedule |
| **11** | **Daily revenue volume** | Target **~₼1500/day** total gross across **all channels**; emulate real cycles with random slow days (**₼800–999**) |
| **12** | **Channel mix** | **Wolt 80%** · **Bolt 10%** · **All others 10%** (ChoiceQR + POS + Kiosk + Online split randomly within the 10% bucket) |

**Scope (confirmed):** Daily gross counts **all channels combined** — manual partner sales on `?screen=sales` **plus** POS/Kiosk/Online order totals.

### Sandbox online auth (no OTP/Google)

Third-party auth is **not** configured for sandbox DB yet. For June simulation:

- **Do NOT** run G-AUTH-05/06/07 (Google, SMS OTP).
- **PRE-03:** Create one sandbox customer via **email/password** in Supabase Auth: `e2e-june@mings.test` (or sign up once on `:4176/order` with email only).
- Online days: **COD takeaway/delivery only** (no card checkout until payment secrets verified).
- **Tracking:** Use `track_token` from orders placed with email customer; skip realtime if no order placed.
- If email signup also fails: run storefront as **browse + cart + checkout UI** negative test (`X-SANDBOX-AUTH-01`); count **Online** channel via staff-visible order-support after manual `sales` is N/A — document gap in ledger.

---

## Menu seed — Jun 1 priority (8 items from Wolt)

Source: [Ming's on Wolt](https://wolt.com/en/aze/baku/restaurant/mings) — prices match Wolt AZN as of plan date.

| # | Wolt name | Category | Price (₼) | E2E product name |
|---|-----------|----------|-----------|------------------|
| 1 | Mushroom Noodles | Wok Fried Noodles | 11.50 | `E2E-Mushroom-Noodles` |
| 2 | Shrimp Noodles | Wok Fried Noodles | 16.94 | `E2E-Shrimp-Noodles` |
| 3 | Smoked Sausage Noodles | Wok Fried Noodles | 9.89 | `E2E-Smoked-Sausage-Noodles` |
| 4 | Chicken Noodles | Wok Fried Noodles | 9.78 | `E2E-Chicken-Noodles` |
| 5 | Egg Noodles | Wok Fried Noodles | 8.58 | `E2E-Egg-Noodles` |
| 6 | Classic Veggie | Wok Fried Noodles | 8.14 | `E2E-Classic-Veggie` |
| 7 | Wok Fried Rice (Classic) | Wok Fried Rice | 9.50 | `E2E-Wok-Fried-Rice` |
| 8 | Soft Drink (500ml) | Drinks | 3.00 | `E2E-Soft-Drink` |

**Jun 1 actions (before other work):**

1. `?screen=menu-builder` → category `E2E-Wok-Noodles` (+ optional `E2E-Drinks`)
2. Create all 8 products with prices above; **kiosk_visible=true**, **online_visible=true**
3. Use **Shrimp Noodles** + **Chicken Noodles** for POS/Kiosk modifier tests (if modifiers exist)

Wolt hours reference for delivery settings: **11:30–22:30** daily (align `online_settings.hours_json` if needed).

---

## Opening balances (Jun 1)

| Account | Amount | Date |
|---------|--------|------|
| **Main bank** | **₼1000** | 2026-06-01 |
| Card | ₼0 (fund later via bank→card transfer Jun 7) | — |
| Cash opening float | ₼100 | 2026-06-01 |

---

## Liabilities schedule (total principal ≤ ₼5000)

| Date | Counterparty | Type | Principal | Notes |
|------|--------------|------|-----------|-------|
| Jun 8 | `E2E-20260608-equipment` | loan | ₼2000 | Equipment finance |
| Jun 20 | `E2E-20260620-supplier-credit` | other | ₼1500 | Informal supplier credit line |
| **Total** | | | **₼3500** | Under ₼5000 cap |

Payments: Jun 8 loan payment ₼200; Jun 29 final payments to settle or `partially_paid` — keep total liability balance ≤ ₼5000 all month.

---

## Fail & negative scenarios (Group X + sandbox)

Run on designated days; **expect** failure — log in ledger as pass if correct behavior.

| ID | Day | Scenario | Expected outcome |
|----|-----|----------|------------------|
| X-SANDBOX-AUTH-01 | 12 | Google sign-in on `:4176/order` | Error or disabled — **do not configure** |
| X-SANDBOX-AUTH-02 | 12 | SMS OTP send | Skip / blocked — sandbox SMS not wired |
| X-BUG-01 | 4 | Kiosk confirm order | 403 on `sales` insert if RLS unfixed |
| X-BUG-06 | 11 | OM picked up | `completed_at` missing error |
| X-BUG-05 | 2 | Products screen save | `category_id` vs `master_category_id` 400 |
| X-POS-03 | 9 | POS delivery no pin | Inline validation; no sale |
| X-CASH-01 | 7 | ATM withdraw ₼99999 | Blocked — exceeds card balance |
| X-EDGE-01 | 27 | Expense amount ₼0 | Toast validation error |
| X-EDGE-02 | 27 | Payout period end before start | Validation error |
| X-CAT-02 | 14 | Delete category in use | `categoryDeleteBlockedInUse` message |
| X-DEL-01 | 13 | Delivery address outside zone | Checkout blocked |
| X-KITCHEN-01 | 19 | Order on special closed day | Kitchen closed message |
| X-SUPPLIER-01 | 16 | Pay supplier more than owed | UI should cap or error |
| X-PAY-01 | 25 | Payout amount > period gross | Warning or validation |
| X-SEC-02 | 27 | Save expense with expired session | Auth error |
| X-OM-01 | 11 | Reject already-completed order | No-op or error |
| X-WITHDRAW-01 | 7 | Cashier withdraw > bank balance | Blocked after ₼1000 opening |

---

## Payout & sales cadence (owner rules)

### Wolt — 5-day sales + payout on day 6 → **Main bank**

| Cycle | Record sales (manual `?screen=sales`) | Record payout (`?screen=payouts`) |
|-------|--------------------------------------|-----------------------------------|
| 1 | **Jun 1–5** (one sale per day) | **Jun 6** — period Jun 1–5, `received_account=bank` |
| 2 | **Jun 7–11** | **Jun 12** — period Jun 7–11, `bank` |
| 3 | **Jun 13–17** | **Jun 18** — period Jun 13–17, `bank` |
| 4 | **Jun 19–23** | **Jun 24** — period Jun 19–23, `bank` |
| 5 | **Jun 24–28** | **Jun 29** — period Jun 24–28, `bank` |

Each Wolt sale: note `E2E-202606XX-wolt`; amount = **80% of daily gross** (see [Daily gross appendix](#daily-gross-appendix-june-1--30)); orders ≈ `round(wolt_amount / 24)`.

Each Bolt sale: note `E2E-202606XX-bolt`; amount = **10% of daily gross**; orders ≈ `round(bolt_amount / 24)`.

Each ChoiceQR sale (manual or top-up): note `E2E-202606XX-cq`; amount = remaining **10% bucket** minus POS/Kiosk/Online totals that day.

Each payout: `payout_amount` ≈ 85% of period gross (simulate commission); verify gross preview matches sum of sales.

### Bolt — weekly sales + payout on day 8 → **Card account**

| Week sales | Payout day | Period | `received_account` |
|------------|------------|--------|-------------------|
| Jun 1–7 | **Jun 8** | Jun 1–7 | `card` |
| Jun 8–14 | **Jun 15** | Jun 8–14 | `card` |
| Jun 15–21 | **Jun 22** | Jun 15–21 | `card` |
| Jun 22–28 | **Jun 29** | Jun 22–28 | `card` |

Record **one Bolt manual sale per day** (amount from appendix). Notes: `E2E-202606XX-bolt`.

### ChoiceQR — always **cash** (confirmed)

Manual sales every 2–3 days; **bi-weekly payout to Cash on hand**:

| Sales window | Payout day | Period | `received_account` |
|--------------|------------|--------|-------------------|
| Jun 1–14 | **Jun 15** | Jun 1–14 | **`cash`** |
| Jun 15–28 | **Jun 29** | Jun 15–28 | **`cash`** |

### App-generated channels (not on Sales screen)

| Channel | How recorded | Minimum in June |
|---------|--------------|-----------------|
| **POS** | `/pos` → New Order | ≥12 orders (mix eat-in/takeaway/delivery) |
| **Kiosk** | `/kiosk` → checkout | ≥4 orders (if RLS fixed) |
| **Online** | `:4176/order` → COD checkout | ≥4 attempts; **email auth only** (no OTP/Google) |

Every channel must appear **at least once** in June; POS/Online repeat on “operations” days. App-channel order totals **count toward the 10% other bucket**; top up ChoiceQR manually if needed.

---

## Daily sales volume model

### Target bands (date-seeded, reproducible)

| Day type | Frequency | Daily gross | Wolt 80% | Bolt 10% | Other 10% |
|----------|-----------|-------------|----------|----------|-----------|
| **Normal** | ~60% of days | ₼1,400–1,650 (center ₼1,500) | 80% | 10% | 10% |
| **Slow** | ~25% | ₼800–999 | 80% | 10% | 10% |
| **Busy** | ~15% | ₼1,650–1,900 | 80% | 10% | 10% |

**Example (Normal ₼1,500):** Wolt **₼1,200** · Bolt **₼150** · Other **₼150** (ChoiceQR / POS / Kiosk / Online).

**Example (Slow ₼850):** Wolt **₼680** · Bolt **₼85** · Other **₼85**.

### “Other 10%” bucket — random split

Within the 10% bucket, vary daily (date-seeded; see appendix **CQ % of other** column):

- **ChoiceQR** (manual): 30–70% of bucket when POS/Kiosk/Online also run
- **POS / Kiosk / Online**: remainder on operational test days
- On days with **no** POS/Kiosk/Online runs, put the full 10% into **ChoiceQR** manual sale(s)

### How to record sales

**Manual channels — `?screen=sales`**

1. Look up the day in [Daily gross appendix](#daily-gross-appendix-june-1--30).
2. Record **one Wolt row** (80%) — note `E2E-202606XX-wolt`.
3. Record **one Bolt row** (10%) — note `E2E-202606XX-bolt`.
4. Record **ChoiceQR** for the other-bucket portion not covered by app orders — note `E2E-202606XX-cq`.

**Date picker (Chrome DevTools MCP):** MCP `click` on calendar day **1** often fails. Use `evaluate_script` to click the day button, **then** Save. Verify the row shows `6/1/2026` not `6/30/2026`.

**App channels** — POS `/pos`, Kiosk `/kiosk`, Online `:4176/order` count toward the other 10%. After app orders, **top up ChoiceQR** if the bucket is not full.

### End-of-day verification

```sql
SELECT sale_date::date AS d,
       SUM(total_amount) AS gross
FROM sales
WHERE notes LIKE 'E2E-202606%' OR description LIKE 'E2E-202606%'
GROUP BY 1 ORDER BY 1;
```

Also check Home `?screen=home` filtered to that date. Log target vs actual in the ledger.

### Reproducible seed helper

```javascript
const seed = YYYYMMDD; // e.g. 20260601
const typeHash = ((seed * 48271) % 2147483647) % 100;
// slow:   gross = 800 + (seed % 200)   when typeHash < 25
// busy:   gross = 1650 + (seed % 251)  when typeHash >= 85
// normal: gross = 1400 + (seed % 251)  otherwise
// wolt = round(gross * 0.8, 2); bolt = round(gross * 0.1, 2); other = gross - wolt - bolt
```

Pre-computed targets: [Daily gross appendix](#daily-gross-appendix-june-1--30).

---

## Complete coverage matrix (nothing skipped)

Tick each row on **Jun 30**.

### Surfaces (7)

- [x] Staff cockpit `/spec-ops`
- [x] POS `/pos`
- [x] Kiosk `/kiosk`
- [x] KDS `/kds`
- [x] Order Manager `/order-manager`
- [ ] Customer Order `:4176/order` — **BLOCKED** SMS OTP at checkout (PRE-03 sign-in OK)
- [x] Tracking `:4176/track?token=` — A-TRACK-01/02/03/LIFE PASS*

### Cockpit screens (19)

- [x] `home` · [x] `sales` · [x] `payments` · [x] `payouts`
- [x] `expenses` (operational + COGS + categories tabs)
- [x] `suppliers` · [x] `liabilities` (loans + withdrawals + cash tabs)
- [x] `staff` · [x] `money` · [x] `reports`
- [x] `order-support` · [x] `delivery` (zones + settings + dispatch)
- [x] `order-locations` · [x] `menu-builder` · [x] `combos` · [x] `products`
- [x] `users` · [x] `audit-log` · [x] `settings`

### Finance functions

- [x] Manual partner sales (Wolt/Bolt/ChoiceQR)
- [x] Operational expense (cash/card/bank)
- [x] COGS on-account + paid-now
- [x] Supplier create/debt/payment
- [x] Payouts with received account
- [x] Opening balances (bank/card)
- [x] Bank→card transfer
- [x] ATM + cashier withdrawals
- [x] Cash movements (float/deposit/adjustment)
- [x] Activity ledger delete (transfer/withdrawal)
- [x] Liability + payment
- [x] Salary + pay period (full + mid-month partial)
- [x] Edit + delete finance rows

### Order lifecycle

- [x] POS → KDS → OM → Order Support (full status path)
- [x] Kiosk order (if unblocked)
- [ ] Online COD + track — **BLOCKED** SMS OTP (admin-api track orders verified separately)
- [x] Reject/cancel with reason
- [ ] Confirm payment (cash/card pending) — **PARTIAL** H-KOB-02 (M002 unpaid after preparing)
- [x] Delivery dispatch + tracking URL — F-DEL-10 PASS

### Catalog

- [x] Menu category/product/modifier/assign
- [x] Combo + upsell
- [ ] Products screen (verify X-BUG-05) — **FAIL\*** D-PROD-01 (400 on edit; read OK)
- [x] OM menu editor toggles — C-OM-15 PASS after `adminApi` fetch fix

### System

- [x] Settings channels/language/theme
- [x] Users CRUD (no delete unless approved)
- [x] Audit log tabs
- [x] Kitchen pause/resume (OM)

**COV-01 gaps (Jun 30):** online checkout OTP, payment webhooks (I-WH), track page realtime (A-TRACK-04 PARTIAL), products edit bug (X-BUG-05).

---

## Day-by-day plan (Jun 1 – Jun 30)

Each day lists **test cases** with: **ID** | **Screen/URL** | **Action** | **Expected table/field**

**Daily sales:** All `E-SALE-*` rows use amounts from the [Daily gross appendix](#daily-gross-appendix-june-1--30) (Wolt 80% / Bolt 10% / other 10%). Verify gross at end of each day.

---

### Jun 1 (Sun) — Month open + **menu seed (priority)**

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| PRE-01 | shell | `npm run env:sandbox`; verify MCP `glpdpkozvmfzgoewquxi` | `.env` URL |
| PRE-02 | `:4175/build-meta.json` | SHA match | gitSha |
| PRE-03 | Supabase Auth (sandbox) | Create `e2e-june@mings.test` email customer (no Google/OTP) | auth user |
| **D-MENU-JUN1** | `?screen=menu-builder` | Create **8 Wolt menu items** (see table above) — **first task** | `products` ×8 |
| F-SET-01/02 | `?screen=settings` | Language EN/AZ/RU; theme toggle | user prefs |
| F-SET-04 | settings | Verify Wolt/Bolt/ChoiceQR/Kiosk/Online/POS active | read |
| F-DEL-04/06/07 | `?screen=delivery&tab=settings` | Kitchen open; hours **11:30–22:30**; delivery+takeaway on | `online_settings` |
| F-DEL-01 | delivery zones | Create `E2E-20260601-zone`, fee ₼2 | `delivery_zones` |
| E-CASH-07 | `?screen=liabilities` → Manage accounts | **Bank opening ₼1000**, Card ₼0, date Jun 1 | `finance_accounts` |
| E-CASH-04 | cash tab | Opening float ₼100 | `cash_movements` |
| **E-SALE-DAY1** | `?screen=sales` | Daily volume — see appendix Jun 1: Wolt + Bolt + ChoiceQR (full other bucket), date **Jun 1** | `sales` |
| E-HOME-01 | `?screen=home` | Filter Jun 1; gross ≈ appendix target | read |

---

### Jun 2 (Mon) — Modifiers + combos (menu already seeded)

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| D-MENU-08/09 | menu modifiers | Group `E2E-20260602-spice` on **Shrimp/Chicken Noodles** | `modifier_*` |
| D-COMB-01 | `?screen=combos` | Combo `E2E-20260602-lunch` (2 noodles + drink) | `combo_deals` |
| D-PROD-01 | `?screen=products` | Attempt save → **X-BUG-05** | — |
| **E-SALE-DAY2** | sales | Daily volume — see appendix Jun 2 | `sales` |

---

### Jun 3 (Tue) — Staff + POS channel

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-STF-01 | `?screen=staff` | Add chef/waiter/expeditor/helper (E2E names) | `employees` |
| A-POS-01 | `/pos` | Eat-in cash, **E2E-Shrimp-Noodles**, `E2E-20260603-pos1` | `sales` source=pos |
| B-KDS-02/03/04 | `/kds` | Prepare → ready → complete POS order | `sales.status` |
| C-OM-06 | `/order-manager` | Accept + prep time | `sales` |
| H-KOB-02 | `?screen=order-support` | Confirm payment if unpaid | `sales.payment_status` |
| **E-SALE-W1D3** | sales | Wolt Jun 3 | `sales` |
| **E-SALE-B-W1D3** | sales | Bolt Jun 3 | `sales` |

---

### Jun 4 (Wed) — Kiosk + takeaway POS

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| A-KIOSK-02..08 | `/kiosk` | Full eat-in order (X-BUG-01 if 403) | `sales` source=kiosk |
| A-POS-02 | `/pos` | Takeaway card + modifiers | `sales` |
| H-SUP-04 | order-support | Reject one order + reason | `sales` cancelled |
| B-KDS-06 | `/kds` | Item prep toggle | edge fn |
| **E-SALE-W1D4** | sales | Wolt Jun 4 | `sales` |
| **E-SALE-B-W1D4** | sales | Bolt Jun 4 | `sales` |

---

### Jun 5 (Thu) — Expenses + Wolt day 5

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-CAT-01/03 | `?screen=expenses` categories | OPEX category + sub-item | `master_categories`, `expense_items` |
| E-OPEX-01 | expenses operational | Cash ₼30, Card ₼45, Bank ₼100 (3 rows) | `operational_expenses` |
| E-MONY-01 | `?screen=money` | View tabs | read |
| **E-SALE-W1D5** | sales | Wolt Jun 5 (completes 5-day cycle) | `sales` |
| **E-SALE-B-W1D5** | sales | Bolt Jun 5 | `sales` |
| **E-SALE-CQ2** | sales | ChoiceQR Jun 5 | `sales` |

---

### Jun 6 (Fri) — Suppliers + **Wolt payout #1**

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| D-SUPP-01 | `?screen=suppliers` | `E2E-20260606-meat`, `E2E-20260606-veg` | `suppliers` |
| E-COGS-04 | expenses COGS | On-account purchase meat supplier | `purchases`, supplier debt |
| E-COGS-01 | expenses COGS | Paid-now cash veg purchase | `purchases` |
| D-SUPP-04/05 | suppliers drawer | Manual debt ₼50; partial payment | `supplier_debts`, `supplier_account_payments` |
| **E-PAY-WOLT-1** | `?screen=payouts` | Wolt payout: period **Jun 1–5**, payout date **Jun 6**, amount ~85% gross, **`received_account=bank`** | `platform_payouts` |
| **E-SALE-B-W1D6** | sales | Bolt Jun 6 (still in week 1) | `sales` |

Verify: Home bank balance ↑; account ledger shows payout line.

---

### Jun 7 (Sat) — Cash ops + Bolt week closes

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-CASH-03 | liabilities withdrawals | Cashier withdrawal ₼100 (bank) | `bank_withdrawals` |
| E-CASH-08 | manage accounts | Bank→card transfer ₼300 | `account_transfers` |
| E-CASH-03 | withdrawals | ATM ₼50 from card | `bank_withdrawals` |
| E-CASH-04 | cash tab | Bank deposit out ₼80 | `cash_movements` |
| E-CASH-06 | cash drawer | Verify breakdown | read |
| **E-SALE-W2D1** | sales | Wolt Jun 7 (start cycle 2) | `sales` |
| **E-SALE-B-W1D7** | sales | Bolt Jun 7 (last day week 1) | `sales` |
| **E-SALE-CQ3** | sales | ChoiceQR Jun 7 | `sales` |

---

### Jun 8 (Sun) — **Bolt payout #1** + liabilities

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-BOLT-1** | payouts | Bolt payout: period **Jun 1–7**, date **Jun 8**, **`received_account=card`** | `platform_payouts` |
| E-CASH-01 | liabilities loans | Loan `E2E-20260608-equipment` **₼2000** | `liabilities` |
| E-CASH-02 | loans | Payment ₼200 | `liability_payments` |
| E-RPT-01 | `?screen=reports` | Jun 1–7 filter | read |
| audit | `?screen=audit-log` | Actions tab Jun 8 | read |
| **E-SALE-W2D2** | sales | Wolt Jun 8 | `sales` |
| **E-SALE-B-W2D1** | sales | Bolt Jun 8 (week 2 start) | `sales` |

Verify: Card account balance ↑ from Bolt payout.

---

### Jun 9 (Mon) — POS delivery + dispatch

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| A-POS-04 | `/pos` | Delivery order (pin+address) | `sales` delivery fields |
| F-DEL-10 | delivery dispatch | Manual dispatch + tracking URL | `delivery_orders` |
| H-SUP-06/08 | order-support | Self dispatch → delivered | `sales.status` |
| E-LOC-01 | `?screen=order-locations` | Map Jun 1–9 | read |
| **E-SALE-W2D3** | sales | Wolt Jun 9 | `sales` |
| **E-SALE-B-W2D2** | sales | Bolt Jun 9 | `sales` |

---

### Jun 10 (Tue) — Menu ops

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| D-MENU-01/02/05/03 | menu-builder | Toggle visibility; duplicate; reorder | `products` |
| D-COMB-04/07 | combos | Edit price; upsell mapping | `combo_deals`, `products` |
| A-KIOSK-07 | `/kiosk` | Upsell if configured | cart |
| **E-SALE-W2D4** | sales | Wolt Jun 10 | `sales` |
| **E-SALE-B-W2D3** | sales | Bolt Jun 10 | `sales` |
| A-POS-01 | `/pos` | Second eat-in cash order | `sales` POS channel |

---

### Jun 11 (Wed) — Order Manager deep

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| C-OM-01/05 | `/order-manager` | Pause 30m → resume | `online_settings` |
| C-OM-10/11 | OM | Ready → picked up (X-BUG-06 watch) | `sales` |
| C-OM-15 | OM menu editor | Toggle kiosk visibility | `products` |
| **E-SALE-W2D5** | sales | Wolt Jun 11 | `sales` |
| **E-SALE-B-W2D4** | sales | Bolt Jun 11 | `sales` |

---

### Jun 12 (Thu) — **Online channel** (email only, no OTP/Google)

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| X-SANDBOX-AUTH-01 | `:4176/order` | Attempt Google sign-in | Fail/skip — not configured |
| X-SANDBOX-AUTH-02 | order | Attempt SMS OTP | Skip |
| G-CART-01 | `:4176/order` | Browse **8 Wolt items**; add Shrimp Noodles + drink | cart |
| G-PROF-01 | order | Sign in **email only** `e2e-june@mings.test` | session |
| A-ONLINE-01 | checkout | COD takeaway `E2E-20260612-online1` | `sales` source=online |
| A-TRACK-01 | `/track?token=` | Open tracking | read |
| H-SUP-02 | order-support | Accept online → preparing | `sales` |
| **E-PAY-WOLT-2** | payouts | Wolt period **Jun 7–11**, date Jun 12, `bank` | `platform_payouts` |

---

### Jun 13 (Fri) — Online delivery + Wolt day 1 cycle 3

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| G-ADDR-01 | order | Save address | `customer_addresses` |
| A-ONLINE-02/03 | checkout | COD delivery in zone + scheduled slot | `sales` |
| A-ONLINE-04 | checkout | Tip + order notes (no promo if none in DB) | `sales` |
| X-DEL-01 | checkout | Address **outside** zone → expect block | validation |
| E-PAYM-01 | `?screen=payments` | Filter online payments (COD only) | read |
| **E-SALE-W3D1** | sales | Wolt Jun 13 | `sales` |
| **E-SALE-B-W2D5** | sales | Bolt Jun 13 | `sales` |

---

### Jun 14 (Sat) — Finance edit/delete + Bolt week 2 ends

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-SALE-02 | sales | Edit manual sale | `sales` |
| E-OPEX-02/03 | expenses | Edit/delete OPEX | `operational_expenses` |
| E-COGS-02/03 | expenses COGS | Edit/delete purchase | `purchases` |
| E-PAY-02 | payouts | Edit payout | `platform_payouts` |
| E-CAT-02 | categories | Delete blocked (in use) | error UX |
| **E-SALE-W3D2** | sales | Wolt Jun 14 | `sales` |
| **E-SALE-B-W2D6** | sales | Bolt Jun 14 | `sales` |
| **E-SALE-B-W2D7** | sales | Bolt Jun 14 (week 2 last day) | `sales` |

---

### Jun 15 (Sun) — **Bolt payout #2** + mid-month payroll + ChoiceQR payout #1

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-BOLT-2** | payouts | Bolt period **Jun 8–14**, date **Jun 15**, `card` | `platform_payouts` |
| **E-PAY-CQ-1** | payouts | ChoiceQR period **Jun 1–14**, date **Jun 15**, `cash` | `platform_payouts` |
| E-STF-03 | staff | Add joiner `E2E-20260615-joiner`; salary ₼250, pay period **Jun 15–30** | `salary_payments` |
| E-STF-04 | staff | Advance ₼50 | `salary_payments` |
| E-COGS-04 | expenses | Large on-account batch | `purchases` |
| D-SUPP-06 | suppliers | Delete payment row | `supplier_account_payments` |
| **E-SALE-W3D3** | sales | Wolt Jun 15 | `sales` |
| **E-SALE-B-W3D1** | sales | Bolt Jun 15 (week 3) | `sales` |

---

### Jun 16 (Mon) — Supplier cycle

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| D-SUPP-05 | suppliers | Lump sum paydown | `supplier_account_payments` |
| D-PROD-08 | expenses COGS | Inline create supplier | `suppliers` |
| A-POS-02 | `/pos` | Takeaway card order | `sales` POS |
| **E-SALE-W3D4** | sales | Wolt Jun 16 | `sales` |
| **E-SALE-B-W3D2** | sales | Bolt Jun 16 | `sales` |
| E-OPEX-01 | expenses | One operational expense | `operational_expenses` |

---

### Jun 17 (Tue) — KDS volume + POS mix

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| A-POS-01/02/04 | `/pos` | 3 orders eat-in/takeaway/delivery | `sales` |
| B-KDS-07/08 | `/kds` | Source filter; history drawer | read |
| B-KDS-05 | `/kds` | Undo complete 5s window | `sales` |
| **E-SALE-W3D5** | sales | Wolt Jun 17 | `sales` |
| **E-SALE-B-W3D3** | sales | Bolt Jun 17 | `sales` |
| A-KIOSK-08 | `/kiosk` | Second kiosk order if unblocked | `sales` kiosk |

---

### Jun 18 (Wed) — **Wolt payout #3** + customer account

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-WOLT-3** | payouts | Wolt period **Jun 13–17**, date **Jun 18**, `bank` | `platform_payouts` |
| G-ADDR-02/03/04 | `:4176/order` | Edit/default/delete address | `customer_addresses` |
| G-FAV-01 | order | Toggle favorite | `customer_favorites` |
| G-ORD-01 | order | Reorder from history | cart |
| G-AUTH-08 | order | Sign out/in | auth |
| **E-SALE-W4D1** | sales | Wolt Jun 18 (cycle 4 start) | `sales` |
| **E-SALE-B-W3D4** | sales | Bolt Jun 18 | `sales` |

---

### Jun 19 (Thu) — Delivery admin

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| F-DEL-02 | delivery zones | Toggle active; edit fee | `delivery_zones` |
| F-DEL-07 | delivery settings | Special day (one June date closed) | `online_settings` |
| F-DEL-08 | dispatch | Wolt stub (sandbox) | boundary |
| **E-SALE-W4D2** | sales | Wolt Jun 19 | `sales` |
| **E-SALE-B-W3D5** | sales | Bolt Jun 19 | `sales` |
| A-ONLINE-01 | `:4176/order` | Second online COD | `sales` online |

---

### Jun 20 (Fri) — Second liability + account ledger

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-CASH-01b | liabilities | `E2E-20260620-supplier-credit` **₼1500** (total principal ₼3500 ≤ ₼5000) | `liabilities` |
| E-CASH-09 | liabilities ledger | Delete one transfer | removed |
| E-CASH-05 | cash | Delete one movement | removed |
| E-CASH-08 | manage accounts | Re-add transfer for math | `account_transfers` |
| **E-SALE-W4D3** | sales | Wolt Jun 20 | `sales` |
| **E-SALE-B-W3D6** | sales | Bolt Jun 20 | `sales` |
| **E-SALE-CQ4** | sales | ChoiceQR Jun 20 | `sales` |

---

### Jun 21 (Sat) — Bolt week 3 ends

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-SALE-W4D4** | sales | Wolt Jun 21 | `sales` |
| **E-SALE-B-W3D7** | sales | Bolt Jun 21 (week 3 last day) | `sales` |
| C-OM-08 | `/order-manager` | Reject order + reason | `sales` |
| H-SUP-05 | order-support | Mark ready | `sales` |
| E-HOME-01 | home | Jun MTD filter | read |

---

### Jun 22 (Sun) — **Bolt payout #3** + full salaries

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-BOLT-3** | payouts | Bolt period **Jun 15–21**, date **Jun 22**, `card` | `platform_payouts` |
| E-STF-02 | staff | Salaries all staff, period **Jun 1–30** | `salary_payments` |
| E-STF-04 | staff | Chef bonus | `salary_payments` |
| **E-SALE-W4D5** | sales | Wolt Jun 22 | `sales` |
| **E-SALE-B-W4D1** | sales | Bolt Jun 22 (week 4) | `sales` |

---

### Jun 23 (Mon) — Settings + users

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| F-SET-03/04/05 | settings | Custom channel create/toggle/soft-delete | `sales_channels` |
| F-USR-01/03/04 | `?screen=users` | Create E2E user; role; reset pwd (no delete) | edge fn |
| **E-SALE-W4D6** | sales | Wolt Jun 23 | `sales` |
| **E-SALE-B-W4D2** | sales | Bolt Jun 23 | `sales` |
| A-POS-01 | `/pos` | POS order | `sales` |

---

### Jun 24 (Tue) — **Wolt payout #4** + tracking

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-WOLT-4** | payouts | Wolt period **Jun 19–23**, date **Jun 24**, `bank` | `platform_payouts` |
| A-ONLINE-01 | `:4176/order` | Third online order | `sales` |
| A-TRACK-04 | track | Realtime while staff marks ready | `sales` |
| A-TRACK-03 | track | Cancelled order scenario | read |
| A-TRACK-02 | track | Missing token | read |
| **E-SALE-W5D1** | sales | Wolt Jun 24 (cycle 5) | `sales` |
| **E-SALE-B-W4D3** | sales | Bolt Jun 24 | `sales` |

---

### Jun 25 (Wed) — Payout edit + sales delete

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-SALE-03 | sales | Delete one E2E manual sale | `sales` |
| E-PAY-03 | payouts | Delete test payout (non-protected) if duplicate | optional |
| E-PAYM-01 | payments | Recheck card payment | boundary |
| **E-SALE-W5D2** | sales | Wolt Jun 25 | `sales` |
| **E-SALE-B-W4D4** | sales | Bolt Jun 25 | `sales` |
| E-COGS-01 | expenses | COGS paid card | `purchases` |

---

### Jun 26 (Thu) — Sandbox golden path replay

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| REG-01 | POS+finance | Repeat POS cash + OPEX + supplier touch | ledger match |
| **E-SALE-W5D3** | sales | Wolt Jun 26 | `sales` |
| **E-SALE-B-W4D5** | sales | Bolt Jun 26 | `sales` |
| E-MONY-01 | money | MTD totals vs ledger | read |

---

### Jun 27 (Fri) — Adversarial (Group X sample)

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| X-EDGE-01 | expenses | Zero amount blocked | validation |
| X-EDGE-02 | payouts | End before start blocked | validation |
| X-CASH-01 | withdrawals | Overdraw blocked | validation |
| **E-SALE-W5D4** | sales | Wolt Jun 27 | `sales` |
| **E-SALE-B-W4D6** | sales | Bolt Jun 27 | `sales` |
| **E-SALE-B-W4D7** | sales | Bolt Jun 27 (week 4 last day) | `sales` |

---

### Jun 28 (Sat) — Webhooks (sandbox) + fail replay

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| I-WH-01/02 | HTTP mock | EPoint + United webhooks (sandbox) | `online_payments` if row exists |
| **E-SALE-W5D5** | sales | Wolt Jun 28 | `sales` |
| X-SEC-02 | expenses | Expired session mid-save | auth error |

---

### Jun 29 (Sun) — **Wolt #5 + Bolt #4 + ChoiceQR #2 payouts** + reconciliation

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| **E-PAY-WOLT-5** | payouts | Wolt period **Jun 24–28**, date **Jun 29**, `bank` | `platform_payouts` |
| **E-PAY-BOLT-4** | payouts | Bolt period **Jun 22–28**, date **Jun 29**, `card` | `platform_payouts` |
| **E-PAY-CQ-2** | payouts | ChoiceQR period **Jun 15–28**, date **Jun 29**, `cash` | `platform_payouts` |
| E-RPT-01 | reports | Full June | read |
| E-HOME-01 | home | June + compare prior | read |
| E-CASH-06 | cash drawer | Final cross-check | read |
| audit | audit-log | Full month | read |
| **E-SALE-CQ5** | sales | ChoiceQR Jun 29 (if needed for coverage) | `sales` |

---

### Jun 30 (Mon) — Month close + coverage sign-off

| ID | Where | Action | Expected |
|----|-------|--------|----------|
| E-STF-04 | staff | Partial payment one employee | `salary_payments` |
| D-SUPP-05 | suppliers | Settle remaining E2E supplier balances | payments |
| E-CASH-02 | liabilities | Final loan payment / settled | `liabilities` |
| COV-01 | all screens | Walk coverage matrix; tick every box | checklist |
| COV-02 | ledger | Export cleanup manifest | doc |
| SNAP-01 | home+reports | Final screenshots | artifacts |

**Optional Jun 30 sale:** One Wolt sale Jun 30 (starts next cycle; no payout in June — document as intentional).

---

## Payout summary calendar

| Date | Event | Account |
|------|-------|---------|
| Jun 6 | Wolt payout #1 (Jun 1–5) | bank |
| Jun 8 | Bolt payout #1 (Jun 1–7) | card |
| Jun 12 | Wolt payout #2 (Jun 7–11) | bank |
| Jun 15 | Bolt payout #2 (Jun 8–14) + ChoiceQR #1 (Jun 1–14) | card + cash |
| Jun 18 | Wolt payout #3 (Jun 13–17) | bank |
| Jun 22 | Bolt payout #3 (Jun 15–21) | card |
| Jun 24 | Wolt payout #4 (Jun 19–23) | bank |
| Jun 29 | Wolt #5 (Jun 24–28) + Bolt #4 (Jun 22–28) + ChoiceQR #2 (Jun 15–28) | bank + card + cash |

---

## What you specified vs gaps filled

| Your rule | Plan implementation |
|-----------|---------------------|
| ChoiceQR always **cash** | Bi-weekly payouts Jun 15 + 29 → `cash` |
| POS / Kiosk / Online | Included; online **email-only**, no OTP/Google |
| Opening balance **₼1000** | Bank ₼1000 Jun 1; card ₼0; cash float ₼100 |
| Full June payroll | Jun 22 salaries period Jun 1–30; joiner Jun 15–30 |
| Liabilities ≤ ₼5000 | ₼2000 + ₼1500 = ₼3500 total principal |
| 8 Wolt menu items | Jun 1 priority — [Wolt menu](https://wolt.com/en/aze/baku/restaurant/mings) |
| No OTP/Google | PRE-03 email customer; X-SANDBOX-AUTH-01/02 negative tests |
| Order lifecycle / edit-delete / system | Woven through month + Jun 14/23/27 |
| Fail scenarios | 16 negative cases in fail table above |
| **Daily sales ~₼1500** | Rules 11–12; appendix table; slow days ₼800–999 |
| **Channel mix 80/10/10** | Wolt / Bolt / other (CQ+POS+Kiosk+Online) |

---

## Daily gross appendix (June 1 – 30)

Generated from the seed helper in [Daily sales volume model](#daily-sales-volume-model). **CQ % of other** = ChoiceQR share of the 10% bucket when app channels also run; on manual-only days use the full **Other 10%** for ChoiceQR.

| Date | Type | Gross ₼ | Wolt 80% | Bolt 10% | Other 10% | Wolt orders | Bolt orders | CQ % of other |
|------|------|---------|----------|----------|-----------|-------------|-------------|---------------|
| 2026-06-01 | busy | 1782 | 1425.6 | 178.2 | 178.2 | 59 | 7 | 30% |
| 2026-06-02 | normal | 1533 | 1226.4 | 153.3 | 153.3 | 51 | 6 | 31% |
| 2026-06-03 | normal | 1534 | 1227.2 | 153.4 | 153.4 | 51 | 6 | 32% |
| 2026-06-04 | busy | 1785 | 1428 | 178.5 | 178.5 | 60 | 7 | 33% |
| 2026-06-05 | normal | 1536 | 1228.8 | 153.6 | 153.6 | 51 | 6 | 34% |
| 2026-06-06 | normal | 1537 | 1229.6 | 153.7 | 153.7 | 51 | 6 | 35% |
| 2026-06-07 | slow | 807 | 645.6 | 80.7 | 80.7 | 27 | 3 | 36% |
| 2026-06-08 | normal | 1539 | 1231.2 | 153.9 | 153.9 | 51 | 6 | 37% |
| 2026-06-09 | normal | 1540 | 1232 | 154 | 154 | 51 | 6 | 38% |
| 2026-06-10 | normal | 1541 | 1232.8 | 154.1 | 154.1 | 51 | 6 | 39% |
| 2026-06-11 | busy | 1792 | 1433.6 | 179.2 | 179.2 | 60 | 7 | 40% |
| 2026-06-12 | normal | 1543 | 1234.4 | 154.3 | 154.3 | 51 | 6 | 41% |
| 2026-06-13 | normal | 1544 | 1235.2 | 154.4 | 154.4 | 51 | 6 | 42% |
| 2026-06-14 | slow | 814 | 651.2 | 81.4 | 81.4 | 27 | 3 | 43% |
| 2026-06-15 | normal | 1546 | 1236.8 | 154.6 | 154.6 | 52 | 6 | 44% |
| 2026-06-16 | normal | 1547 | 1237.6 | 154.7 | 154.7 | 52 | 6 | 45% |
| 2026-06-17 | slow | 817 | 653.6 | 81.7 | 81.7 | 27 | 3 | 46% |
| 2026-06-18 | busy | 1799 | 1439.2 | 179.9 | 179.9 | 60 | 7 | 47% |
| 2026-06-19 | normal | 1550 | 1240 | 155 | 155 | 52 | 6 | 48% |
| 2026-06-20 | normal | 1551 | 1240.8 | 155.1 | 155.1 | 52 | 6 | 49% |
| 2026-06-21 | slow | 821 | 656.8 | 82.1 | 82.1 | 27 | 3 | 50% |
| 2026-06-22 | normal | 1553 | 1242.4 | 155.3 | 155.3 | 52 | 6 | 51% |
| 2026-06-23 | normal | 1554 | 1243.2 | 155.4 | 155.4 | 52 | 6 | 52% |
| 2026-06-24 | slow | 824 | 659.2 | 82.4 | 82.4 | 27 | 3 | 53% |
| 2026-06-25 | busy | 1806 | 1444.8 | 180.6 | 180.6 | 60 | 8 | 54% |
| 2026-06-26 | normal | 1557 | 1245.6 | 155.7 | 155.7 | 52 | 6 | 55% |
| 2026-06-27 | normal | 1558 | 1246.4 | 155.8 | 155.8 | 52 | 6 | 56% |
| 2026-06-28 | slow | 828 | 662.4 | 82.8 | 82.8 | 28 | 3 | 57% |
| 2026-06-29 | normal | 1560 | 1248 | 156 | 156 | 52 | 7 | 58% |
| 2026-06-30 | normal | 1561 | 1248.8 | 156.1 | 156.1 | 52 | 7 | 59% |

Regenerate: `node tmp/gen-june-daily-gross.mjs`

---

## Execution order when you say "start Day 1"

1. `npm run env:sandbox` + MCP verify  
2. `npm run supabase:push`  
3. `npm run deploy:local` + `npm run deploy:local:storefront`  
4. Chrome DevTools MCP (`user-chrome-devtools`): staff login on sandbox — **not** Playwright or cursor-ide-browser
5. Execute Jun 1 table top-to-bottom; ledger + screenshot each write  
