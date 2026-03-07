/*
  # Rebuild Platform Payouts Table

  The existing platform_payouts table has an incorrect schema and insecure RLS policies.
  Since it contains no data, we drop and recreate it with the correct structure.

  1. Changes
    - Drop existing insecure policies
    - Drop and recreate `platform_payouts` table with simplified schema:
      - `id` (uuid, primary key)
      - `sales_channel_id` (uuid, FK to sales_channels) - which platform
      - `period_start` (date) - payout period start
      - `period_end` (date) - payout period end
      - `payout_amount` (numeric) - actual amount received from platform
      - `payout_date` (date) - when the payout was received
      - `notes` (text) - optional notes
      - `created_by` (uuid, FK to auth.users) - record owner
      - `created_at` / `updated_at` (timestamptz) - timestamps

  2. Security
    - Enable RLS
    - Proper ownership-based policies for SELECT, INSERT, UPDATE, DELETE
    - All policies check auth.uid() = created_by

  3. Notes
    - Commission is NOT stored; it is derived as: gross_sales - payout_amount
    - gross_sales comes from querying the sales table for the matching channel and date range
*/

DROP POLICY IF EXISTS "Authenticated users can delete platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can insert platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can update platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can view platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Users can delete platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Users can insert platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Users can update platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Users can view platform payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can view payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can insert payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can update own payouts" ON platform_payouts;
DROP POLICY IF EXISTS "Authenticated users can delete own payouts" ON platform_payouts;

DROP TABLE IF EXISTS platform_payouts;

CREATE TABLE platform_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_channel_id uuid NOT NULL REFERENCES sales_channels(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  payout_amount numeric NOT NULL DEFAULT 0,
  payout_date date NOT NULL,
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payout_period CHECK (period_end >= period_start)
);

ALTER TABLE platform_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts"
  ON platform_payouts FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert own payouts"
  ON platform_payouts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own payouts"
  ON platform_payouts FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own payouts"
  ON platform_payouts FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX idx_payouts_channel ON platform_payouts(sales_channel_id);
CREATE INDEX idx_payouts_period ON platform_payouts(period_start, period_end);
CREATE INDEX idx_payouts_date ON platform_payouts(payout_date);
