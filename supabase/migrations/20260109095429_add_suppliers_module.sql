/*
  # Add Suppliers Module

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text) - Supplier name
      - `contact_person` (text) - Contact person name
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `address` (text) - Physical address
      - `notes` (text) - Additional notes
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Changes to Existing Tables
    - Add `supplier_id` column to `products` table to link products with suppliers
    - Add foreign key constraint from products to suppliers

  3. Security
    - Enable RLS on `suppliers` table
    - Add policies for anonymous access (matching existing product patterns)
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add supplier_id to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers (anonymous access for demo purposes)
CREATE POLICY "Allow anonymous read access to suppliers"
  ON suppliers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert suppliers"
  ON suppliers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update suppliers"
  ON suppliers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete suppliers"
  ON suppliers FOR DELETE
  TO anon
  USING (true);

-- Create index for supplier_id in products for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();