/*
  # Reset All Data Except Users and Sales Channels

  1. Purpose
    - Clear all transactional and master data to start fresh
    - Preserve user accounts and authentication data
    - Preserve sales channel configurations

  2. Tables Cleared
    - products (all product data)
    - purchases (all purchase records)
    - sales (all sales records)
    - operational_expenses (all expense records)
    - suppliers (all supplier records)
    - categories (all categories)
    - master_categories (all master categories)
    - transactions (all transaction records)
    - customers (all customer records)
    - payment_methods (all payment methods)
    - recurring_transactions (all recurring transaction templates)
    - budgets (all budget records)
    - goals (all goal records)
    - barcode_scans (all scan history)
    - price_history (all price change history)
    - supplier_orders (all supplier orders)
    - supplier_payments (all payment records)
    - audit_logs (all audit history)
    - user_preferences (all user preferences)

  3. Tables Preserved
    - users (all user accounts kept)
    - sales_channels (all sales channel configurations kept)
    - auth.users (managed by Supabase, not touched)

  4. Security
    - RLS policies remain intact
    - Only data is cleared, schema is preserved
*/

-- Clear audit logs first (no dependencies)
TRUNCATE TABLE audit_logs CASCADE;

-- Clear transactional data
TRUNCATE TABLE barcode_scans CASCADE;
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE supplier_payments CASCADE;
TRUNCATE TABLE supplier_orders CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE operational_expenses CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Clear master data
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE master_categories CASCADE;

-- Clear planning data
TRUNCATE TABLE recurring_transactions CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE goals CASCADE;

-- Clear preferences
TRUNCATE TABLE user_preferences CASCADE;