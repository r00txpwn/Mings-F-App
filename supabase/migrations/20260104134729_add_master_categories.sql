/*
  # Add Master Categories System

  1. New Tables
    - `master_categories`
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `description` (text, optional description)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - `categories`
      - Add `master_category_id` (uuid, nullable foreign key to master_categories)
      - Categories can optionally belong to a master category

  3. Security
    - Enable RLS on `master_categories` table
    - Add policies for authenticated users to manage master categories
*/

-- Create master_categories table
CREATE TABLE IF NOT EXISTS master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view master categories"
  ON master_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert master categories"
  ON master_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update master categories"
  ON master_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete master categories"
  ON master_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Add master_category_id to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'master_category_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN master_category_id uuid REFERENCES master_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert some default master categories
INSERT INTO master_categories (name, description) 
VALUES 
  ('Food Cost', 'All food-related expenses'),
  ('Operational Costs', 'General business operations'),
  ('Revenue', 'Income sources')
ON CONFLICT DO NOTHING;
