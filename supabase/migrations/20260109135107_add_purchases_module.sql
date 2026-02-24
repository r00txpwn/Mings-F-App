/*
  # Add Purchases Module

  ## Overview
  Creates a purchases system to track product inventory purchases from suppliers.
  This connects products, suppliers, and money flow logically.

  ## New Tables
  1. `purchases` - Product purchase transactions
     - `id` (uuid, primary key)
     - `product_id` (uuid, references products)
     - `supplier_id` (uuid, references suppliers)
     - `quantity` (integer) - Number of units purchased
     - `unit_cost` (numeric) - Cost per unit
     - `total_cost` (numeric) - Total purchase cost
     - `purchase_date` (timestamptz) - When the purchase was made
     - `payment_status` (enum) - pending, partial, paid
     - `notes` (text) - Additional notes
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)

  2. `expense_categories` - Categories for operational expenses
     - `id` (uuid, primary key)
     - `name` (text) - Category name (e.g., Rent, Utilities, Salaries)
     - `description` (text)
     - `icon` (text) - Icon name
     - `color` (text) - Display color
     - `is_active` (boolean)
     - `created_at` (timestamptz)

  3. `operational_expenses` - Non-product operational expenses
     - `id` (uuid, primary key)
     - `category_id` (uuid, references expense_categories)
     - `amount` (numeric)
     - `description` (text)
     - `expense_date` (date)
     - `payment_method` (text)
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all records
  - Staff can insert/update their own records
  - Admins can delete records

  ## Notes
  - Purchases track product inventory acquisition from suppliers
  - This separates operational expenses from inventory purchases
  - Links products, suppliers, and expenses logically
*/

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost >= 0),
  purchase_date timestamptz DEFAULT now(),
  payment_status payment_status DEFAULT 'pending',
  notes text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Anyone can read purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update purchases"
  ON purchases FOR UPDATE
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

CREATE POLICY "Admins can delete purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'circle',
  color text DEFAULT '#6B7280',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Anyone can read expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert expense categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update expense categories"
  ON expense_categories FOR UPDATE
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

CREATE POLICY "Admins can delete expense categories"
  ON expense_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create operational_expenses table
CREATE TABLE IF NOT EXISTS operational_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  expense_date date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operational_expenses
CREATE POLICY "Anyone can read operational expenses"
  ON operational_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert operational expenses"
  ON operational_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update operational expenses"
  ON operational_expenses FOR UPDATE
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

CREATE POLICY "Admins can delete operational expenses"
  ON operational_expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default expense categories
INSERT INTO expense_categories (name, description, icon, color) VALUES
  ('Rent', 'Office or store rent', 'home', '#EF4444'),
  ('Utilities', 'Electricity, water, internet', 'zap', '#F59E0B'),
  ('Salaries', 'Employee salaries and wages', 'users', '#10B981'),
  ('Marketing', 'Advertising and promotion', 'megaphone', '#3B82F6'),
  ('Transportation', 'Delivery and vehicle costs', 'truck', '#8B5CF6'),
  ('Maintenance', 'Repairs and upkeep', 'wrench', '#6B7280'),
  ('Office Supplies', 'Stationery and equipment', 'clipboard', '#EC4899'),
  ('Insurance', 'Business insurance', 'shield', '#14B8A6'),
  ('Taxes & Fees', 'Government taxes and fees', 'file-text', '#F97316'),
  ('Other', 'Miscellaneous expenses', 'more-horizontal', '#64748B');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_category ON operational_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_date ON operational_expenses(expense_date);
