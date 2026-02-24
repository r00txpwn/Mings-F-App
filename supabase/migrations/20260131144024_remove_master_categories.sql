/*
  # Remove Master Categories

  1. Changes
    - Drop master_category_id column from products table
    - Drop master_category_id column from categories table
    - Drop master_categories table
  
  2. Notes
    - Master categories are not needed
    - Only purchase and expense categories are required
*/

-- Drop foreign key constraints first
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_master_category_id_fkey'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_master_category_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_master_category_id_fkey'
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT categories_master_category_id_fkey;
  END IF;
END $$;

-- Drop columns
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'master_category_id'
  ) THEN
    ALTER TABLE products DROP COLUMN master_category_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'master_category_id'
  ) THEN
    ALTER TABLE categories DROP COLUMN master_category_id;
  END IF;
END $$;

-- Drop master_categories table
DROP TABLE IF EXISTS master_categories;