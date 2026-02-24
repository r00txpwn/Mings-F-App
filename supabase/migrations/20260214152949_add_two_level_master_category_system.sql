/*
  # Add Two-Level Master Category System for COGS and Fixed Costs

  ## Overview
  This migration implements a consistent two-level structure for both COGS and fixed costs.
  - Master categories group related items (e.g., "Taxi", "Vegetables")
  - Products belong to COGS master categories (type='purchase')
  - Expense items belong to fixed cost master categories (type='expense')
  
  ## Changes Made
  
  ### 1. Rename categories table to master_categories
  - Renames the categories table to master_categories for clarity
  - Updates all foreign key references and indexes
  - Maintains all existing data and relationships
  
  ### 2. Create expense_items table
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, required) - Name of the expense item (e.g., "Ibrahim Taxi")
  - `master_category_id` (uuid, foreign key) - Links to master_categories
  - `user_id` (uuid, foreign key) - User who created the expense item
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. Update purchases table
  - Add `expense_item_id` (uuid, nullable) - Links to expense_items for fixed cost purchases
  - Existing `product_id` remains for COGS purchases
  - One of product_id or expense_item_id will be populated based on purchase type
  - Rename category_id to master_category_id
  
  ### 4. Update operational_expenses table
  - Add `expense_item_id` (uuid, nullable) - Links to expense_items
  - Rename category_id to master_category_id
  
  ### 5. Security - Row Level Security (RLS)
  - Enable RLS on expense_items table
  - Add policies for authenticated users to manage their expense items
*/

-- Step 1: Rename categories table to master_categories
ALTER TABLE IF EXISTS categories RENAME TO master_categories;

-- Step 2: Rename category_id to master_category_id in products table
DO $$
BEGIN
  -- Drop the old foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_category_id_fkey' AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_id_fkey;
  END IF;

  -- Rename the column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products RENAME COLUMN category_id TO master_category_id;
  END IF;

  -- Add the new foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_master_category_id_fkey' AND table_name = 'products'
  ) THEN
    ALTER TABLE products 
      ADD CONSTRAINT products_master_category_id_fkey 
      FOREIGN KEY (master_category_id) 
      REFERENCES master_categories(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Step 3: Create expense_items table
CREATE TABLE IF NOT EXISTS expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  master_category_id uuid NOT NULL REFERENCES master_categories(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for expense_items
CREATE INDEX IF NOT EXISTS expense_items_master_category_id_idx ON expense_items(master_category_id);
CREATE INDEX IF NOT EXISTS expense_items_user_id_idx ON expense_items(user_id);

-- Step 4: Add expense_item_id to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'expense_item_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN expense_item_id uuid REFERENCES expense_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS purchases_expense_item_id_idx ON purchases(expense_item_id);

-- Step 5: Rename category_id to master_category_id in purchases table
DO $$
BEGIN
  -- Drop the old foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchases_category_id_fkey' AND table_name = 'purchases'
  ) THEN
    ALTER TABLE purchases DROP CONSTRAINT purchases_category_id_fkey;
  END IF;

  -- Rename the column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE purchases RENAME COLUMN category_id TO master_category_id;
  END IF;

  -- Add the new foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchases_master_category_id_fkey' AND table_name = 'purchases'
  ) THEN
    ALTER TABLE purchases 
      ADD CONSTRAINT purchases_master_category_id_fkey 
      FOREIGN KEY (master_category_id) 
      REFERENCES master_categories(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Step 6: Add expense_item_id to operational_expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operational_expenses' AND column_name = 'expense_item_id'
  ) THEN
    ALTER TABLE operational_expenses ADD COLUMN expense_item_id uuid REFERENCES expense_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS operational_expenses_expense_item_id_idx ON operational_expenses(expense_item_id);

-- Step 7: Rename category_id to master_category_id in operational_expenses table
DO $$
BEGIN
  -- Drop the old foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'operational_expenses_category_id_fkey' AND table_name = 'operational_expenses'
  ) THEN
    ALTER TABLE operational_expenses DROP CONSTRAINT operational_expenses_category_id_fkey;
  END IF;

  -- Rename the column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operational_expenses' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE operational_expenses RENAME COLUMN category_id TO master_category_id;
  END IF;

  -- Add the new foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'operational_expenses_master_category_id_fkey' AND table_name = 'operational_expenses'
  ) THEN
    ALTER TABLE operational_expenses 
      ADD CONSTRAINT operational_expenses_master_category_id_fkey 
      FOREIGN KEY (master_category_id) 
      REFERENCES master_categories(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Step 8: Enable RLS on expense_items
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for expense_items
CREATE POLICY "Authenticated users can view all expense items"
  ON expense_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own expense items"
  ON expense_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update all expense items"
  ON expense_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expense items they created"
  ON expense_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 10: Create updated_at trigger for expense_items
CREATE OR REPLACE FUNCTION update_expense_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expense_items_updated_at ON expense_items;
CREATE TRIGGER expense_items_updated_at
  BEFORE UPDATE ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_items_updated_at();