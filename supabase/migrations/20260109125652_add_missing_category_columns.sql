/*
  # Add Missing Columns to Categories Table

  1. Changes
    - Add `type` column (income/expense/sale) to categories
    - Add `icon` column for visual representation
    - Add `color` column for UI theming

  2. Notes
    - Allows categories to be typed for different transaction types
    - Supports visual customization
*/

-- Create enum for category type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('income', 'expense', 'sale');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to categories table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'type'
  ) THEN
    ALTER TABLE categories ADD COLUMN type category_type DEFAULT 'expense';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon text DEFAULT 'circle';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'color'
  ) THEN
    ALTER TABLE categories ADD COLUMN color text DEFAULT '#6B7280';
  END IF;
END $$;
