/*
  # Add Advanced Features Schema

  ## New Tables
  
  1. **products**
    - `id` (uuid, primary key)
    - `name` (text) - Product/service name
    - `description` (text) - Product description
    - `price` (decimal) - Unit price
    - `cost` (decimal) - Cost price for profit calculation
    - `sku` (text) - Stock keeping unit
    - `stock_quantity` (integer) - Current inventory
    - `low_stock_alert` (integer) - Alert threshold
    - `is_active` (boolean) - Active status
    - `category` (text) - Product category
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. **customers**
    - `id` (uuid, primary key)
    - `name` (text) - Customer name
    - `email` (text) - Customer email
    - `phone` (text) - Customer phone
    - `address` (text) - Customer address
    - `notes` (text) - Additional notes
    - `total_spent` (decimal) - Lifetime value
    - `total_orders` (integer) - Order count
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  3. **payment_methods**
    - `id` (uuid, primary key)
    - `name` (text) - Method name (Cash, Card, Bank Transfer)
    - `icon` (text) - Emoji icon
    - `color` (text) - Display color
    - `is_active` (boolean)
    - `created_at` (timestamptz)
  
  4. **budgets**
    - `id` (uuid, primary key)
    - `category_id` (uuid, foreign key)
    - `amount` (decimal) - Budget limit
    - `period` (text) - daily, weekly, monthly
    - `start_date` (date)
    - `is_active` (boolean)
    - `created_at` (timestamptz)
  
  5. **goals**
    - `id` (uuid, primary key)
    - `name` (text) - Goal name
    - `target_amount` (decimal) - Target amount
    - `current_amount` (decimal) - Current progress
    - `deadline` (date)
    - `category` (text) - sales, profit, revenue
    - `is_completed` (boolean)
    - `created_at` (timestamptz)
  
  6. **recurring_transactions**
    - `id` (uuid, primary key)
    - `type` (text) - income, expense, sale
    - `amount` (decimal)
    - `description` (text)
    - `category_id` (uuid, foreign key)
    - `frequency` (text) - daily, weekly, monthly, yearly
    - `next_date` (date)
    - `is_active` (boolean)
    - `created_at` (timestamptz)

  ## Modified Tables
  
  - Add `customer_id` to transactions
  - Add `product_id` to transactions
  - Add `payment_method_id` to transactions
  
  ## Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated access
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  cost decimal(10,2) DEFAULT 0,
  sku text,
  stock_quantity integer DEFAULT 0,
  low_stock_alert integer DEFAULT 10,
  is_active boolean DEFAULT true,
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  total_spent decimal(10,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '💳',
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  period text NOT NULL DEFAULT 'monthly',
  start_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount decimal(10,2) NOT NULL,
  current_amount decimal(10,2) DEFAULT 0,
  deadline date,
  category text DEFAULT 'sales',
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view goals"
  ON goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage goals"
  ON goals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  next_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recurring transactions"
  ON recurring_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage recurring transactions"
  ON recurring_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add new columns to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert default payment methods
INSERT INTO payment_methods (name, icon, color) VALUES
  ('Cash', '💵', '#10B981'),
  ('Card', '💳', '#3B82F6'),
  ('Bank Transfer', '🏦', '#8B5CF6'),
  ('Digital Wallet', '📱', '#F59E0B')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(is_completed);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(is_active);
