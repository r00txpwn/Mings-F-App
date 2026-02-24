/*
  # Business Management System Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `type` (text) - 'income', 'expense', or 'sale'
      - `icon` (text) - Icon name for display
      - `color` (text) - Color code for visual distinction
      - `created_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `amount` (numeric) - Transaction amount
      - `description` (text) - Optional description
      - `transaction_date` (date) - Date of transaction
      - `type` (text) - 'income', 'expense', or 'sale'
      - `created_at` (timestamptz)
    
    - `user_preferences`
      - `id` (uuid, primary key)
      - `language` (text) - 'en', 'az', or 'ru'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public access policies for demo (can be restricted later with auth)
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'sale')),
  icon text DEFAULT 'circle',
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'sale')),
  created_at timestamptz DEFAULT now()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'az', 'ru')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Public access policies (for demo purposes)
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to categories"
  ON categories FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to categories"
  ON categories FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from categories"
  ON categories FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to transactions"
  ON transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to transactions"
  ON transactions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to transactions"
  ON transactions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from transactions"
  ON transactions FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to user_preferences"
  ON user_preferences FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to user_preferences"
  ON user_preferences FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to user_preferences"
  ON user_preferences FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO categories (name, type, icon, color) VALUES
  ('Sales', 'sale', 'shopping-cart', '#10B981'),
  ('Salary', 'income', 'banknote', '#3B82F6'),
  ('Rent', 'expense', 'home', '#EF4444'),
  ('Utilities', 'expense', 'zap', '#F59E0B'),
  ('Supplies', 'expense', 'package', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Insert default user preference
INSERT INTO user_preferences (language) VALUES ('en')
ON CONFLICT DO NOTHING;