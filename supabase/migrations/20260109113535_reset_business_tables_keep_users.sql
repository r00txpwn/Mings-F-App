/*
  # Reset Business Database (Keep Users)

  1. Purpose
    - Drop all business tables in public schema
    - Keep auth.users and auth.identities intact
    - Prepare for clean schema recreation

  2. Tables Dropped
    - All business tables (sales, products, suppliers, etc.)
    - All tracking tables
    - All configuration tables

  3. Security
    - Auth tables are untouched
    - Users remain logged in
*/

-- Drop all tables in public schema
DROP TABLE IF EXISTS public.sales_channel_logos CASCADE;
DROP TABLE IF EXISTS public.supplier_payments CASCADE;
DROP TABLE IF EXISTS public.supplier_orders CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.barcode_scans CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.master_categories CASCADE;
DROP TABLE IF EXISTS public.sales_channels CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop any remaining objects
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;