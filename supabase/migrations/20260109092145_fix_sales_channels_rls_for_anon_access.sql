/*
  # Fix Sales Channels RLS for Anonymous Access

  1. Changes
    - Update RLS policies on sales_channels table to allow anonymous (unauthenticated) access
    - This enables the app to function without requiring user authentication

  2. Security
    - Policies updated to use `TO anon` instead of `TO authenticated`
    - Anonymous users can read all sales channels
    - Anonymous users can manage channels (for single-user business app)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all sales channels" ON sales_channels;
DROP POLICY IF EXISTS "Users can insert sales channels" ON sales_channels;
DROP POLICY IF EXISTS "Users can update sales channels" ON sales_channels;
DROP POLICY IF EXISTS "Users can delete sales channels" ON sales_channels;

-- Create new policies for anonymous access
CREATE POLICY "Anyone can view all sales channels"
  ON sales_channels
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert sales channels"
  ON sales_channels
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update sales channels"
  ON sales_channels
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sales channels"
  ON sales_channels
  FOR DELETE
  TO anon
  USING (true);
