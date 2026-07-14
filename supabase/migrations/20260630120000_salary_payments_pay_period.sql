-- Pay period covered by a salary payment (distinct from payment_date, the day
-- the money actually went out). Lets admins record e.g. June 1–30, or a partial
-- period for a mid-month joiner (e.g. June 15–30). Nullable so legacy rows and
-- one-off advances/bonuses without a period stay valid.

ALTER TABLE salary_payments
  ADD COLUMN IF NOT EXISTS period_start date;

ALTER TABLE salary_payments
  ADD COLUMN IF NOT EXISTS period_end date;

ALTER TABLE salary_payments
  DROP CONSTRAINT IF EXISTS salary_payments_period_order_check;

ALTER TABLE salary_payments
  ADD CONSTRAINT salary_payments_period_order_check
  CHECK (
    period_start IS NULL
    OR period_end IS NULL
    OR period_end >= period_start
  );

COMMENT ON COLUMN salary_payments.period_start IS 'First day of the pay period this payment covers (nullable).';
COMMENT ON COLUMN salary_payments.period_end IS 'Last day of the pay period this payment covers (nullable).';
