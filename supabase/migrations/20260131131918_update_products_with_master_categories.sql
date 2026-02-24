/*
  # Update Products to Use Master Categories

  1. Changes
    - Add `master_category_id` column to products table
    - This links products directly to master categories
    - Remove the dependency on sub-categories for COGS tracking
    - Purchases will automatically inherit master category from product

  2. Migration Steps
    - Add master_category_id column to products
    - Products can now be assigned directly to master categories
    - The category_id on products remains for other use cases (if needed)
    - The category_id on purchases becomes optional (derived from product)
*/

-- Add master_category_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'master_category_id'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN master_category_id uuid REFERENCES master_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Make purchases.category_id nullable (it will be derived from product)
DO $$
BEGIN
  ALTER TABLE purchases ALTER COLUMN category_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_master_category_id ON products(master_category_id);
