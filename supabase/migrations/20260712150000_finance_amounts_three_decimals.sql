-- Finance amount columns: 2 decimal places -> 3 (milli-qəpik) for cockpit finance inputs.
-- Does NOT alter sales, menu, or customer-facing price columns.

ALTER TABLE operational_expenses
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE purchases
  ALTER COLUMN quantity TYPE numeric(12,3),
  ALTER COLUMN unit_cost TYPE numeric(12,3),
  ALTER COLUMN total_cost TYPE numeric(12,3);

ALTER TABLE employees
  ALTER COLUMN total_salary TYPE numeric(12,3),
  ALTER COLUMN official_salary TYPE numeric(12,3);

ALTER TABLE salary_payments
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE liabilities
  ALTER COLUMN principal_amount TYPE numeric(12,3);

ALTER TABLE liability_payments
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE bank_withdrawals
  ALTER COLUMN amount TYPE numeric(12,3),
  ALTER COLUMN fee_amount TYPE numeric(12,3);

ALTER TABLE supplier_debts
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE supplier_account_payments
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE cash_movements
  ALTER COLUMN amount TYPE numeric(12,3);

ALTER TABLE finance_accounts
  ALTER COLUMN opening_balance TYPE numeric(12,3);

ALTER TABLE account_transfers
  ALTER COLUMN amount TYPE numeric(12,3),
  ALTER COLUMN fee_amount TYPE numeric(12,3);

ALTER TABLE tax_payments
  ALTER COLUMN amount TYPE numeric(12,3);
