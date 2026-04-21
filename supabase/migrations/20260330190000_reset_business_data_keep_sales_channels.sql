/*
  # Reset business data — keep sales_channels and staff users

  Clears transactional and catalog data so you can start fresh. Does **not** touch:

  - `public.sales_channels` (all rows and IDs preserved — Wolt/Bolt/Online/Kiosk etc.)
  - `public.users` (staff profiles; `auth.users` unchanged — sign-in accounts remain)

  Optional tables (if present in your project): `online_payments`, `delivery_orders`,
  `delivery_zones` are cleared. `online_settings` is **not** truncated so `/order`
  keeps working; delete or edit that row in Supabase if you want a full storefront reset.

  Apply with: `npx supabase db push` (linked project) or run this file in the SQL Editor.
*/

DO $$
DECLARE
  tables text[] := ARRAY[
    'sale_item_modifiers',
    'sale_items',
    'online_payments',
    'saved_cards',
    'delivery_orders',
    'platform_payouts',
    'sales',
    'product_modifier_groups',
    'modifier_options',
    'modifier_groups',
    'barcode_scans',
    'price_history',
    'supplier_payments',
    'supplier_orders',
    'operational_expenses',
    'purchases',
    'expense_items',
    'products',
    'master_categories',
    'suppliers',
    'customers',
    'audit_logs',
    'payment_methods',
    'recurring_transactions',
    'budgets',
    'goals',
    'transactions',
    'customer_addresses',
    'customer_profiles',
    'user_preferences',
    'delivery_zones'
  ];
  t text;
  parts text[] := ARRAY[]::text[];
  stmt text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      parts := array_append(parts, format('public.%I', t));
    END IF;
  END LOOP;

  IF coalesce(array_length(parts, 1), 0) = 0 THEN
    RAISE NOTICE 'reset_business_data_keep_sales_channels: no matching tables found; nothing to truncate.';
    RETURN;
  END IF;

  stmt := 'TRUNCATE TABLE ' || array_to_string(parts, ', ') || ' RESTART IDENTITY CASCADE';
  EXECUTE stmt;
  RAISE NOTICE 'Truncated % table(s).', array_length(parts, 1);
END $$;
