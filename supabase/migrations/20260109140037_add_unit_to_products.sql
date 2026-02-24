/*
  # Add Unit Measurement to Products

  ## Overview
  Adds unit of measurement tracking to products so users can specify whether
  products are measured in kilograms, liters, pieces, etc.

  ## Changes
  1. Create enum for product units
     - `kg` - Kilogram
     - `g` - Gram
     - `l` - Liter
     - `ml` - Milliliter
     - `pcs` - Pieces
     - `box` - Box
     - `pack` - Pack
     - `unit` - Unit

  2. Add `unit` column to products table
     - Type: product_unit enum
     - Default: 'pcs' (pieces)
     - Not nullable

  ## Security
  - No changes to RLS policies needed

  ## Notes
  - Existing products will default to 'pcs' (pieces)
  - This helps track inventory accurately based on measurement type
*/

-- Create enum for product units
DO $$ BEGIN
  CREATE TYPE product_unit AS ENUM ('kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack', 'unit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add unit column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit product_unit DEFAULT 'pcs' NOT NULL;
  END IF;
END $$;
