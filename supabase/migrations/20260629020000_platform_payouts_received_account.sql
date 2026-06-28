-- Track which account a platform payout actually landed in, so the payout
-- credits the right balance (Wolt -> Main bank, Bolt -> Card, ChoiceQR -> Cash).
-- Nullable: legacy payouts have no account and do not move any balance.

ALTER TABLE platform_payouts
  ADD COLUMN IF NOT EXISTS received_account text;

ALTER TABLE platform_payouts
  DROP CONSTRAINT IF EXISTS platform_payouts_received_account_check;

ALTER TABLE platform_payouts
  ADD CONSTRAINT platform_payouts_received_account_check
  CHECK (received_account IS NULL OR received_account IN ('cash', 'bank', 'card'));

COMMENT ON COLUMN platform_payouts.received_account IS
  'Which finance account the payout landed in: cash | bank | card. NULL = report-only (does not affect balances).';
