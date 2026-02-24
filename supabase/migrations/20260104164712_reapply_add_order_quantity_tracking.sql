/*
  # Add Order Quantity Tracking

  1. Changes to Existing Tables
    - `transactions`
      - Add `order_count` (integer, default 1) - Number of orders/items in this transaction
      - Useful for calculating AOV (Average Order Value)

  2. Notes
    - This enables tracking of:
      - Total number of orders
      - Average Order Value (AOV) = Total Sales / Number of Orders
      - Better sales analytics and insights
*/

-- Add order_count column to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'order_count'
  ) THEN
    ALTER TABLE transactions ADD COLUMN order_count integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Update existing transactions to have order_count = 1
UPDATE transactions SET order_count = 1 WHERE order_count IS NULL;
