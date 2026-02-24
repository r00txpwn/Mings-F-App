/*
  # Remove Income Category Type
  
  1. **Changes**
    - Remove 'income' value from category_type enum
    - Delete any existing categories with type 'income'
    - Clean up master categories related to income
  
  2. **Reasoning**
    - Income tracking is handled through sales channels
    - No logical need for income categories in expense/purchase tracking
    - Simplifies the category system to COGS (purchase) and Fixed Costs (expense)
  
  3. **Important Notes**
    - PostgreSQL enums cannot have values removed directly
    - We need to create a new enum type and migrate the column
    - Existing data tagged as 'income' will be deleted first
*/

-- Step 1: Delete any income-type categories
DELETE FROM categories WHERE type = 'income';

-- Step 2: Delete "Revenue" master category if it exists
DELETE FROM master_categories WHERE name = 'Revenue';

-- Step 3: Create new enum without 'income'
DO $$ 
BEGIN
  -- Drop the old enum and create new one
  DROP TYPE IF EXISTS category_type_new CASCADE;
  CREATE TYPE category_type_new AS ENUM ('expense', 'sale', 'purchase');
  
  -- Drop default, alter column type, then restore default
  ALTER TABLE categories ALTER COLUMN type DROP DEFAULT;
  ALTER TABLE categories ALTER COLUMN type TYPE category_type_new USING type::text::category_type_new;
  ALTER TABLE categories ALTER COLUMN type SET DEFAULT 'expense'::category_type_new;
  
  -- Drop old type and rename new one
  DROP TYPE IF EXISTS category_type;
  ALTER TYPE category_type_new RENAME TO category_type;
END $$;
