/*
  # Add Modifier System for Kiosk Menu

  1. New Tables
    - `modifier_groups`
      - `id` (uuid, primary key)
      - `product_id` (uuid, FK to products)
      - `name` (text) - e.g. "Choose Your Size", "Extra Toppings"
      - `display_order` (integer) - sorting within product
      - `min_select` (integer) - minimum selections required (0 = optional)
      - `max_select` (integer) - maximum selections allowed (1 = single-choice radio, >1 = multi-choice)
      - `is_required` (boolean) - whether customer must make a selection
      - `created_at` (timestamptz)

    - `modifier_options`
      - `id` (uuid, primary key)
      - `modifier_group_id` (uuid, FK to modifier_groups)
      - `name` (text) - e.g. "Small", "Large", "Extra Cheese"
      - `price_adjustment` (numeric) - added to base price (0 = free)
      - `image_url` (text, nullable) - optional image for visual pickers
      - `is_default` (boolean) - pre-selected by default
      - `is_available` (boolean) - can be toggled off without deleting
      - `display_order` (integer) - sorting within group
      - `created_at` (timestamptz)

    - `sale_item_modifiers`
      - `id` (uuid, primary key)
      - `sale_item_id` (uuid, FK to sale_items)
      - `modifier_group_name` (text) - snapshot of group name at order time
      - `modifier_option_name` (text) - snapshot of option name at order time
      - `price_adjustment` (numeric) - snapshot of price at order time
      - `created_at` (timestamptz)

  2. Modified Tables
    - `products` - add `display_order` column for menu sorting
    - `master_categories` - add `display_order` column for category sorting

  3. Security
    - Enable RLS on all new tables
    - Authenticated users get full CRUD on modifier_groups and modifier_options
    - Anon users get SELECT on modifier_groups and modifier_options (kiosk reads)
    - Anon users get INSERT on sale_item_modifiers (kiosk orders)
    - Authenticated users get full access on sale_item_modifiers

  4. Important Notes
    - modifier_groups.min_select=1 + max_select=1 = single-choice (radio buttons)
    - modifier_groups.min_select=0 + max_select=3 = optional multi-choice (up to 3)
    - sale_item_modifiers stores snapshots so historical orders remain accurate
    - display_order columns enable admin-controlled sorting
*/

-- Add display_order to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE products ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Add display_order to master_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'master_categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE master_categories ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS modifier_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  min_select integer DEFAULT 0,
  max_select integer DEFAULT 1,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read modifier groups"
  ON modifier_groups FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert modifier groups"
  ON modifier_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update modifier groups"
  ON modifier_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete modifier groups"
  ON modifier_groups FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon users can read modifier groups"
  ON modifier_groups FOR SELECT
  TO anon
  USING (true);

-- Create modifier_options table
CREATE TABLE IF NOT EXISTS modifier_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_group_id uuid NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_adjustment numeric DEFAULT 0,
  image_url text,
  is_default boolean DEFAULT false,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read modifier options"
  ON modifier_options FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert modifier options"
  ON modifier_options FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update modifier options"
  ON modifier_options FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete modifier options"
  ON modifier_options FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon users can read modifier options"
  ON modifier_options FOR SELECT
  TO anon
  USING (true);

-- Create sale_item_modifiers table
CREATE TABLE IF NOT EXISTS sale_item_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id uuid NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  modifier_group_name text NOT NULL,
  modifier_option_name text NOT NULL,
  price_adjustment numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sale_item_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sale item modifiers"
  ON sale_item_modifiers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sale item modifiers"
  ON sale_item_modifiers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sale item modifiers"
  ON sale_item_modifiers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sale item modifiers"
  ON sale_item_modifiers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon users can insert sale item modifiers for kiosk orders"
  ON sale_item_modifiers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.id = sale_item_id
      AND s.source = 'kiosk'
    )
  );

CREATE POLICY "Anon users can read sale item modifiers"
  ON sale_item_modifiers FOR SELECT
  TO anon
  USING (true);
