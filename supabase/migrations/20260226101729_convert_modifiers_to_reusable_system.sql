/*
  # Convert Modifiers to Reusable System

  Previously, modifier_groups were tied 1:1 to products via product_id.
  This migration converts them to reusable templates that can be assigned 
  to multiple products via a join table.

  1. New Tables
    - `product_modifier_groups` (join table)
      - `id` (uuid, primary key)
      - `product_id` (uuid, FK to products) - the product
      - `modifier_group_id` (uuid, FK to modifier_groups) - the modifier group
      - `display_order` (integer) - ordering of this group within the product
      - `created_at` (timestamptz)
      - Unique constraint on (product_id, modifier_group_id) to prevent duplicates

  2. Modified Tables
    - `modifier_groups` - product_id column will no longer be used (kept nullable for safety)

  3. Data Migration
    - Existing modifier_groups with product_id get entries in product_modifier_groups
    - product_id on modifier_groups made nullable

  4. Security
    - Enable RLS on product_modifier_groups
    - Authenticated users get full CRUD
    - Anon users get SELECT (for kiosk reads)
*/

-- Create the join table
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  modifier_group_id uuid NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, modifier_group_id)
);

ALTER TABLE product_modifier_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product modifier groups"
  ON product_modifier_groups FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product modifier groups"
  ON product_modifier_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product modifier groups"
  ON product_modifier_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product modifier groups"
  ON product_modifier_groups FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon users can read product modifier groups"
  ON product_modifier_groups FOR SELECT
  TO anon
  USING (true);

-- Migrate existing data: create join table entries for existing product_id relationships
INSERT INTO product_modifier_groups (product_id, modifier_group_id, display_order)
SELECT mg.product_id, mg.id, mg.display_order
FROM modifier_groups mg
WHERE mg.product_id IS NOT NULL
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Make product_id nullable on modifier_groups (keep column for safety, no data drop)
ALTER TABLE modifier_groups ALTER COLUMN product_id DROP NOT NULL;
