/*
  # Fix sales update policy and migrate existing transaction data

  1. Security Changes
    - Update the "Staff can update own sales" policy to also allow admins to update any sale
    - This matches the delete policy pattern already in place

  2. Data Migration
    - Copy 3 existing sale records from `transactions` table into `sales` table
    - Maps: amount -> total_price, order_count -> quantity, channel_id -> sales_channel_id
    - Calculates unit_price as amount / order_count
    - Sets created_by to the admin user
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'Staff can update own sales'
  ) THEN
    DROP POLICY "Staff can update own sales" ON sales;
  END IF;
END $$;

CREATE POLICY "Staff can update own sales or admin can update any"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
    )
  );

INSERT INTO sales (sales_channel_id, quantity, unit_price, total_price, sale_date, notes, created_by)
SELECT
  t.channel_id,
  t.order_count,
  CASE WHEN t.order_count > 0 THEN t.amount / t.order_count ELSE t.amount END,
  t.amount,
  t.transaction_date::timestamptz,
  COALESCE(t.description, ''),
  (SELECT id FROM users WHERE role = 'admin'::user_role LIMIT 1)
FROM transactions t
WHERE t.type = 'sale'
AND NOT EXISTS (
  SELECT 1 FROM sales s
  WHERE s.sales_channel_id = t.channel_id
  AND s.total_price = t.amount
  AND s.sale_date::date = t.transaction_date
);