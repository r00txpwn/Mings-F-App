# Taxes & Payroll — deprecated (2026-06-29)

## Status

The **Taxes** cockpit screen (`?screen=taxes`) and all tax estimation logic were **removed** from the app on 2026-06-29. Old bookmarks redirect to **Payroll** (`?screen=staff`).

**Payroll (Staff & Salaries)** remains active at **`?screen=staff`**.

Track tax payments as normal **operational expenses** (Expenses hub) with your own categories — the app no longer estimates sales tax or payroll tax liabilities.

## Month payroll model (2026-08-01)

Staff screen is **month-based** (not a free date range):

- Each employee has **`hired_at`** (start date), optional **`left_at`** (last employed day, inclusive), and **`weekly_off_weekday`** (0=Sunday … 6=Saturday; default Sunday).
- Monthly salary **includes** the weekly off day. Only days marked **`absent`** (during employment) deduct pay.
- **Day rate** = `monthly_salary ÷ calendar days in that month` (28–31).
- **Payable** = `dailyRate × (employmentDays − absentDays)` (floor at 0), where employment days run from `max(monthStart, hired_at)` through `min(monthEnd, left_at)`.
- **Leave:** **Mark as left** sets `left_at` + `is_active = false` (do not delete). Leavers stay visible in the leave month; later months hide them unless “Show left” is on. **Rehire** clears `left_at` and reactivates.
- Per-date overrides live in **`employee_day_marks`** (`weekly_off` | `absent` | `work`). Default weekly offs are suggested in the UI when no row exists.
- Recording a payment still writes **`salary_payments`** (cash ledger). Home/Reports **payroll KPI stays cash-based** (`sum(salary_payments)`); absences / leave only change suggested payable on the Staff screen.

Additive migration: `20260801120000_employee_attendance_marks.sql` (adds column + new table; no drops).

## Database tables (preserved, orphaned)

Migration `20260627120000_taxes_and_payroll.sql` created:

| Table | Status |
|-------|--------|
| `employees` | **Active** — Staff / Payroll screen (+ `weekly_off_weekday`) |
| `salary_payments` | **Active** — Staff / Payroll screen |
| `employee_day_marks` | **Active** — month attendance / absence marks |
| `tax_settings` | **Orphaned** — no UI; data kept for audit |
| `tax_payments` | **Orphaned** — no UI; data kept for audit |

Do **not** drop these tables without an explicit owner decision and backup.

## Net profit formula (current)

```
netProfit = operatingProfit - bankFees - payroll - platformCommissions
foodCostPct = COGS / netRevenue × 100
netProfitPct = netProfit / netRevenue × 100
```

- **payroll** = sum of `salary_payments` in the selected period
- **platformCommissions** = implied from entered `platform_payouts`: `max(0, channel_period_gross − payout_amount)` (0 when no payouts recorded)
- Tax is **not** estimated; if logged as an operational expense it is already inside **opex** / **operatingProfit**

Home and Reports both use this shared formula via `computeExecutiveKpis`.
Do **not** also enter salaries under Expenses → “Salaries” — that double-counts (see warning on the Staff screen).

## Bank / card withdrawal fees

Rates for cashier (bank) and ATM (card) cash-outs are editable in **Settings → Withdrawal fees**
(`finance_withdrawal_fee_settings`). Defaults: bank **0.5%**, card **1%** (min ₼1).

- Fees are **snapshotted** onto each `bank_withdrawals` row (`fee_rate`, `fee_amount`) at insert time.
- Changing Settings does **not** rewrite historical Net Profit, cash drawer, or account balances.
- New withdrawals use the current settings; fee is never greater than the withdrawal amount.

## Removed code (reference)

| Path | Was |
|------|-----|
| `src/screens/TaxesScreen.tsx` | Taxes UI |
| `src/services/finance/taxFinanceService.ts` | Period tax aggregation |
| `src/services/finance/salesTax.ts` | Turnover tax math |
| `src/services/finance/payrollTax.ts` | AZ payroll tax math |

## QA URLs

- Payroll: `http://127.0.0.1:4175/spec-ops?screen=staff`
- Legacy taxes link (redirect): `http://127.0.0.1:4175/spec-ops?screen=taxes` → Staff
