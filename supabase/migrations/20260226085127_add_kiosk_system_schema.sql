/*
  # Add Kiosk Ordering System - Schema Changes

  1. Products Table Changes
    - `kiosk_visible` (boolean, default true) - controls which products appear on the kiosk
    - `image_url` (text, nullable) - product photo URL for kiosk display cards

  2. Category Type Enum Extension
    - Add 'menu' value to category_type enum for kiosk-specific menu categories

  3. Sales Table Changes
    - `source` (text, default 'manual') - distinguishes kiosk orders from admin entries
    - `order_status` (text, default 'pending') - tracks order lifecycle
    - `payment_status` (text, default 'paid') - backward-compatible default for manual sales
    - `daily_order_number` (integer, nullable) - sequential daily number for kiosk orders
    - `display_number` (text, nullable) - formatted display like "M001"
    - `prep_started_at` (timestamptz, nullable) - when kitchen started preparing
    - `ready_at` (timestamptz, nullable) - when order was marked ready

  4. New Tables
    - `sale_items` - line items for kiosk orders (product snapshot, qty, price, notes)

  5. Functions
    - `generate_daily_order_number()` - atomic daily sequence generator for kiosk orders

  6. Security
    - RLS on sale_items with appropriate policies
    - Anon INSERT policy on sales for kiosk source
    - Anon SELECT policy on products for kiosk visibility

  7. Realtime
    - Enable realtime on sales and sale_items tables

  8. Data
    - Insert 'Kiosk' sales channel
*/

-- 1. Add columns to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'kiosk_visible'
  ) THEN
    ALTER TABLE products ADD COLUMN kiosk_visible boolean DEFAULT true NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

-- 2. Extend category_type enum with 'menu'
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'menu';

-- 3. Add columns to sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'source'
  ) THEN
    ALTER TABLE sales ADD COLUMN source text DEFAULT 'manual' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'order_status'
  ) THEN
    ALTER TABLE sales ADD COLUMN order_status text DEFAULT 'pending' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_status text DEFAULT 'paid' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'daily_order_number'
  ) THEN
    ALTER TABLE sales ADD COLUMN daily_order_number integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'display_number'
  ) THEN
    ALTER TABLE sales ADD COLUMN display_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'prep_started_at'
  ) THEN
    ALTER TABLE sales ADD COLUMN prep_started_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE sales ADD COLUMN ready_at timestamptz;
  END IF;
END $$;

-- 4. Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sale items"
  ON sale_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can insert kiosk sale items"
  ON sale_items FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.source = 'kiosk'
    )
  );

CREATE POLICY "Admins can delete sale items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_sales_source_status ON sales(source, order_status);
CREATE INDEX IF NOT EXISTS idx_sales_daily_number ON sales(sale_date, source, daily_order_number);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- 6. Daily order number function
CREATE OR REPLACE FUNCTION generate_daily_order_number()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
BEGIN
  PERFORM pg_advisory_xact_lock(42);
  SELECT COALESCE(MAX(daily_order_number), 0) + 1
  INTO next_number
  FROM sales
  WHERE sale_date::date = CURRENT_DATE
  AND source = 'kiosk';
  RETURN next_number;
END;
$$;

-- 7. Anon policies for kiosk access on sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Anon can insert kiosk sales'
  ) THEN
    CREATE POLICY "Anon can insert kiosk sales"
      ON sales FOR INSERT
      TO anon
      WITH CHECK (source = 'kiosk');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Anon can read kiosk sales'
  ) THEN
    CREATE POLICY "Anon can read kiosk sales"
      ON sales FOR SELECT
      TO anon
      USING (source = 'kiosk');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Anon can update kiosk order status'
  ) THEN
    CREATE POLICY "Anon can update kiosk order status"
      ON sales FOR UPDATE
      TO anon
      USING (source = 'kiosk')
      WITH CHECK (source = 'kiosk');
  END IF;
END $$;

-- 8. Anon SELECT policy on products for kiosk
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anon can read kiosk visible products'
  ) THEN
    CREATE POLICY "Anon can read kiosk visible products"
      ON products FOR SELECT
      TO anon
      USING (kiosk_visible = true AND selling_price > 0);
  END IF;
END $$;

-- 9. Anon SELECT on sales_channels for kiosk
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales_channels' AND policyname = 'Anon can read kiosk channel'
  ) THEN
    CREATE POLICY "Anon can read kiosk channel"
      ON sales_channels FOR SELECT
      TO anon
      USING (name = 'Kiosk');
  END IF;
END $$;

-- 10. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;

-- 11. Insert Kiosk sales channel
INSERT INTO sales_channels (name, icon, color, is_active, display_order)
SELECT 'Kiosk', 'monitor', '#10B981', true, 99
WHERE NOT EXISTS (SELECT 1 FROM sales_channels WHERE name = 'Kiosk');
