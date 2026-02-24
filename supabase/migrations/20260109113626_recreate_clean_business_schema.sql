/*
  # Clean Business Management Schema

  1. New Tables
    - `users` - User accounts with roles
    - `sales_channels` - Sales platforms (with logo support)
    - `master_categories` - Top-level product categories
    - `categories` - Product categories linked to master categories
    - `products` - Product inventory with tracking
    - `sales` - Sales transactions
    - `price_history` - Product price changes
    - `barcode_scans` - Barcode scanning logs
    - `suppliers` - Supplier management
    - `supplier_orders` - Purchase orders
    - `supplier_payments` - Payment tracking

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users only
    - Proper access control

  3. Features
    - Complete inventory management
    - Sales tracking with channels
    - Supplier management
    - Price history tracking
    - Multi-currency support
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role user_role DEFAULT 'staff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales channels table
CREATE TABLE sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sales channels"
  ON sales_channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert sales channels"
  ON sales_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update sales channels"
  ON sales_channels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete sales channels"
  ON sales_channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Master categories table
CREATE TABLE master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read master categories"
  ON master_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert master categories"
  ON master_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update master categories"
  ON master_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete master categories"
  ON master_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_category_id uuid REFERENCES master_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  quantity integer DEFAULT 0,
  cost_price numeric(10,2) DEFAULT 0,
  selling_price numeric(10,2) DEFAULT 0,
  min_stock_level integer DEFAULT 0,
  description text DEFAULT '',
  last_order_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sales_channel_id uuid REFERENCES sales_channels(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  sale_date timestamptz DEFAULT now(),
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update own sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Price history table
CREATE TABLE price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  old_price numeric(10,2) NOT NULL,
  new_price numeric(10,2) NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert price history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Barcode scans table
CREATE TABLE barcode_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  scanned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  scanned_at timestamptz DEFAULT now(),
  action text DEFAULT 'lookup'
);

ALTER TABLE barcode_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barcode scans"
  ON barcode_scans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert barcode scans"
  ON barcode_scans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

-- Suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Supplier orders table
CREATE TABLE supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  order_date timestamptz DEFAULT now(),
  expected_delivery timestamptz,
  total_amount numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplier orders"
  ON supplier_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert supplier orders"
  ON supplier_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update supplier orders"
  ON supplier_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete supplier orders"
  ON supplier_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Supplier payments table
CREATE TABLE supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES supplier_orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_date timestamptz DEFAULT now(),
  payment_method text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplier payments"
  ON supplier_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert supplier payments"
  ON supplier_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete supplier payments"
  ON supplier_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default master categories
INSERT INTO master_categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and fashion items'),
  ('Food & Beverages', 'Food products and drinks'),
  ('Home & Garden', 'Home improvement and garden supplies'),
  ('Health & Beauty', 'Health and beauty products'),
  ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
  ('Books & Media', 'Books, movies, music, and games'),
  ('Toys & Games', 'Toys and gaming products'),
  ('Office Supplies', 'Office and school supplies'),
  ('Automotive', 'Car parts and accessories');

-- Insert default sales channels
INSERT INTO sales_channels (name, description) VALUES
  ('In-Store', 'Direct sales at physical location'),
  ('Online Store', 'Sales through company website'),
  ('Amazon', 'Sales through Amazon marketplace'),
  ('eBay', 'Sales through eBay marketplace'),
  ('Social Media', 'Sales through social media platforms');

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_channel ON sales(sales_channel_id);
CREATE INDEX idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_payments_order ON supplier_payments(order_id);