/*
  Reset business data on the LINKED Supabase project (staging).

  KEEPS:
  - auth.users (login accounts)
  - public.users (staff profiles)
  - public.sales_channels (Wolt, Bolt, Online, Kiosk, POS, …)
  - public.online_settings (storefront kitchen gate)

  CLEARS:
  - orders, sales, payments, delivery, menu/catalog, expenses, suppliers, customers, …

  Run in Supabase Dashboard → SQL Editor, or:
    npm run supabase:reset:business-data

  After reset, re-apply system sales channels if needed:
    npm run supabase:push   (runs pending migrations only)
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
    'combo_group_items',
    'combo_groups',
    'combo_deals',
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
    'admin_audit_log',
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
    RAISE NOTICE 'reset: no matching tables found.';
    RETURN;
  END IF;

  stmt := 'TRUNCATE TABLE ' || array_to_string(parts, ', ') || ' RESTART IDENTITY CASCADE';
  EXECUTE stmt;
  RAISE NOTICE 'reset: truncated % table(s).', array_length(parts, 1);
END $$;

-- Fix Money / Expenses supplier join (idempotent)
GRANT SELECT ON TABLE public.suppliers TO authenticated;

DROP POLICY IF EXISTS "Anyone can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anonymous read access to suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Staff can view suppliers" ON public.suppliers;
CREATE POLICY "Staff can view suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_staff_user());

-- Re-activate system sales channels (rows are not truncated)
UPDATE public.sales_channels
SET is_deleted = false, is_active = true
WHERE lower(trim(name)) IN ('kiosk', 'online', 'pos')
   OR lower(trim(name)) ~ '^(wolt|bolt)(\s|$)'
   OR lower(trim(name)) = 'bolt food';
