# Taxes & Payroll — deprecated (2026-06-29)

## Status

The **Taxes** cockpit screen (`?screen=taxes`) and all tax estimation logic were **removed** from the app on 2026-06-29. Old bookmarks redirect to **Payroll** (`?screen=staff`).

**Payroll (Staff & Salaries)** remains active at **`?screen=staff`**.

Track tax payments as normal **operational expenses** (Expenses hub) with your own categories — the app no longer estimates sales tax or payroll tax liabilities.

## Database tables (preserved, orphaned)

Migration `20260627120000_taxes_and_payroll.sql` created:

| Table | Status |
|-------|--------|
| `employees` | **Active** — Staff / Payroll screen |
| `salary_payments` | **Active** — Staff / Payroll screen |
| `tax_settings` | **Orphaned** — no UI; data kept for audit |
| `tax_payments` | **Orphaned** — no UI; data kept for audit |

Do **not** drop these tables without an explicit owner decision and backup.

## Net profit formula (current)

```
netProfit = operatingProfit - bankFees - payroll
```

- **payroll** = sum of `salary_payments` in the selected period
- Tax is **not** estimated; if logged as an operational expense it is already inside **opex** / **operatingProfit**

Do **not** also enter salaries under Expenses → “Salaries” — that double-counts (see warning on the Staff screen).

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
