/*
  # Consolidate Expense Categories to Unified Categories System

  1. Changes
    - Migrate all expense_categories data to categories table with type='expense'
    - Update operational_expenses to reference categories table
    - Drop the redundant expense_categories table
  
  2. Security
    - Maintain existing RLS policies on categories table
    - No changes to operational_expenses RLS policies
*/

-- Step 1: Migrate expense_categories to categories (if they have data)
DO $$
BEGIN
  INSERT INTO categories (id, name, description, icon, color, type, created_at)
  SELECT 
    id,
    name,
    description,
    icon,
    color,
    'expense'::category_type,
    created_at
  FROM expense_categories
  WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE categories.id = expense_categories.id
  );
END $$;

-- Step 2: Update operational_expenses foreign key to reference categories
ALTER TABLE operational_expenses DROP CONSTRAINT IF EXISTS operational_expenses_category_id_fkey;

ALTER TABLE operational_expenses 
ADD CONSTRAINT operational_expenses_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;

-- Step 3: Drop the expense_categories table
DROP TABLE IF EXISTS expense_categories CASCADE;
