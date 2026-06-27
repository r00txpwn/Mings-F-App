# Taxes & Payroll (Azerbaijan MMC)

Staff cockpit modules for **Staff & Salaries** (`?screen=staff`) and **Taxes** (`?screen=taxes`).

## What applies (2026 defaults)

Rates are **configurable** in `tax_settings` (Taxes → Rate settings). Defaults match common Azerbaijan private-sector rules for a restaurant MMC:

### Simplified sales / turnover tax (public catering)

- Default catering rate in 2026 is often **8%** (or **6%** for integrated POS non-cash).
- A special **2%** regime exists for qualifying businesses (prior 12-month turnover ≤ 100,000 AZN, ≥1 year in current regime, formal application).
- Ming's OS defaults both cash and non-cash rates to **2%** — change in Taxes settings if your regime differs.
- Turnover is split **cash vs non-cash** using `sales.online_payment_method` (card/epoint/online → non-cash; cod/cash → cash).

### Payroll taxes (on **official declared** salary only)

Computed per employee from `employees.official_salary` (not total cash paid):

- **Income tax (PIT):** progressive brackets with 200 AZN exempt on first bracket (2026 private non-oil defaults).
- **DSMF (social insurance):** employee + employer shares with caps above 8,000 AZN.
- **Medical + unemployment insurance:** configurable % splits.

**Unofficial pay** (total salary minus official base) is recorded in salary payments but carries **no payroll tax** in the app.

## Database tables

| Table | Purpose |
|-------|---------|
| `employees` | Roster: name, designation, total vs official monthly salary |
| `salary_payments` | Dated ledger: salary, advance, partial, bonus |
| `tax_settings` | Singleton configurable rates |
| `tax_payments` | Log when taxes were paid to the state |

Migration: `supabase/migrations/20260627120000_taxes_and_payroll.sql`

## P&L integration

Executive KPIs (`HomeScreen`, `ReportsScreen`) use:

```
operatingProfit = netRevenue - cogs - opex   // unchanged
netProfit = operatingProfit - bankFees - salesTax - payroll - employerContributions
```

- **payroll** = sum of `salary_payments` in the period (actual cash out)
- **employerContributions** = prorated employer-side payroll taxes on active employees' official bases
- **salesTax** = computed from period turnover × configured rates

Do **not** also enter salaries under Expenses → “Salaries” or taxes under “Taxes & Fees” — that double-counts.

## Services

| File | Role |
|------|------|
| `src/services/finance/payrollTax.ts` | Pure AZ payroll tax math |
| `src/services/finance/salesTax.ts` | Simplified turnover tax + cash/non-cash classifier |
| `src/services/finance/taxFinanceService.ts` | Period aggregation for analytics |

## Local QA URLs

- Staff: `http://127.0.0.1:4175/spec-ops?screen=staff`
- Taxes: `http://127.0.0.1:4175/spec-ops?screen=taxes`

Confirm rates with your accountant before filing.
