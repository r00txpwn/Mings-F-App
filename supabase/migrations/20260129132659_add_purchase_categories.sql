/*
  # Add Purchase Category Support

  ## Changes
  1. **Category Types**
    - Add 'purchase' type to category_type enum for COGS tracking
    
  2. **Purchases Table**
    - Add category_id column to link purchases to categories
    - Add foreign key constraint to categories table
    
  3. **Business Logic**
    - Purchase categories separate COGS from operational expenses
    - Enables proper profit calculation: Sales - COGS - OpEx = Net Profit
    
  ## Migration Notes
  - Existing purchases remain valid (category_id is nullable)
  - Existing expense categories unchanged
  - No data loss
*/

-- Add 'purchase' to category_type enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'category_type' AND e.enumlabel = 'purchase'
  ) THEN
    ALTER TYPE category_type ADD VALUE 'purchase';
  END IF;
END $$;

-- Add category_id to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN category_id uuid REFERENCES categories(id);
    CREATE INDEX IF NOT EXISTS idx_purchases_category_id ON purchases(category_id);
  END IF;
END $$;