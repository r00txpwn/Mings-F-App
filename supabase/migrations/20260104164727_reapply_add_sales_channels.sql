/*
  # Add Sales Channels Support

  1. New Tables
    - `sales_channels`
      - `id` (uuid, primary key)
      - `name` (text) - Channel name (e.g., "Wolt", "Bolt", "ChoiceQR", "Offline")
      - `icon` (text) - Icon identifier for UI
      - `color` (text) - Color code for UI display
      - `is_active` (boolean) - Whether channel is currently active
      - `created_at` (timestamp)

  2. Changes to Existing Tables
    - `transactions`
      - Add `channel_id` (uuid, foreign key to sales_channels) - Source of the sale
      - Only applicable for 'sale' type transactions

  3. Security
    - Enable RLS on `sales_channels` table
    - Add policies for authenticated users to read channels
    - Add policies for authenticated users to manage channels

  4. Default Data
    - Pre-populate common sales channels: Wolt, Bolt Food, ChoiceQR, Offline, Other
*/

-- Create sales_channels table
CREATE TABLE IF NOT EXISTS sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '📱',
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add channel_id to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN channel_id uuid REFERENCES sales_channels(id);
  END IF;
END $$;

-- Enable RLS on sales_channels
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_channels
CREATE POLICY "Users can view all sales channels"
  ON sales_channels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert sales channels"
  ON sales_channels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sales channels"
  ON sales_channels
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete sales channels"
  ON sales_channels
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default sales channels
INSERT INTO sales_channels (name, icon, color, is_active) VALUES
  ('Wolt', '🛵', '#00c2e8', true),
  ('Bolt Food', '⚡', '#34d186', true),
  ('ChoiceQR', '📱', '#8b5cf6', true),
  ('Offline', '🏪', '#ef4444', true),
  ('Other', '📦', '#6b7280', true)
ON CONFLICT DO NOTHING;
