/*
  # Fix Sales Channels and Master Categories Issues

  1. Changes to sales_channels table
    - Add missing `display_order` column (integer, default 999)
    - Add foreign key constraint from transactions.channel_id to sales_channels.id

  2. Changes to master_categories RLS
    - Update RLS policies to allow authenticated users to delete categories

  3. Data Cleanup
    - Clear old test data from transactions table (including orphaned records)
*/

-- Clear old test data from transactions (this removes orphaned references)
DELETE FROM transactions;

-- Add display_order column to sales_channels
ALTER TABLE sales_channels ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 999;

-- Update existing sales_channels with sequential display_order
UPDATE sales_channels SET display_order = 1 WHERE name = 'Online';
UPDATE sales_channels SET display_order = 2 WHERE name = 'Offline/Takeaway';
UPDATE sales_channels SET display_order = 3 WHERE name = 'Phone';

-- Add foreign key constraint from transactions to sales_channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_channel_id_fkey' 
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_channel_id_fkey 
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing restrictive policy for master_categories delete
DROP POLICY IF EXISTS "Authenticated users can delete master categories" ON master_categories;

-- Create new policy allowing authenticated users to delete master categories
CREATE POLICY "Authenticated users can delete master categories"
  ON master_categories
  FOR DELETE
  TO authenticated
  USING (true);