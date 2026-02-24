/*
  # Add supplier relationship to products

  ## Changes
    - Add `supplier_id` column to products table
    - Create foreign key constraint to suppliers table
    - No changes to existing data (all products will have NULL supplier initially)

  ## Security
    - No changes to RLS policies needed
*/

-- Add supplier_id column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
