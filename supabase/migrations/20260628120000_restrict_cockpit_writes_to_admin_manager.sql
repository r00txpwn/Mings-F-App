/*
  # Restrict cockpit writes to admin / manager (Access Control — Phase A3)

  Context
  -------
  `staff`-role users are blocked from the cockpit UI (see src/App.tsx). This
  migration adds the **server-side** counterpart so a `staff` account cannot
  mutate cockpit-only finance / catalog / config tables by calling PostgREST
  directly with its own JWT.

  Two write paths exist in this app:
    1. `admin-api` Edge Function — uses the SERVICE ROLE key, which BYPASSES
       RLS. It is gated in code by `TABLE_MIN_ROLE` (updated alongside this
       migration). This is the primary path the cockpit uses.
    2. Direct PostgREST client writes (anon/authenticated key) — gated by the
       RLS policies below. This migration is the defense-in-depth layer for
       that path.

  What this changes
  -----------------
  For the cockpit-only tables listed below:
    * INSERT / UPDATE  -> require admin OR manager (`is_admin_or_manager()`)
    * DELETE           -> require admin only (`is_admin()`)
    * SELECT           -> LEFT UNCHANGED (storefront menu reads, reporting, and
                          existing "Anyone can read" policies keep working)

  This is purely restrictive (it only removes `staff` write access; it never
  grants new access). Manager capability is intentionally preserved for now and
  will be refined in a later pass.

  Intentionally EXCLUDED (floor / storefront surfaces write these directly):
    * sales                -> Order Manager updates order status as staff
    * sale_item_modifiers  -> created during order placement
    * online_settings      -> kitchen pause toggle used on the floor

  Safety: the helper fails loudly if a target table has a `FOR ALL` policy
  (which would also cover SELECT) so we never silently leave a write hole or
  clobber read access.
*/

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin'::public.user_role, 'manager'::public.user_role)
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;

-- ---------------------------------------------------------------------------
-- Helper: rewrite write policies to admin/manager (insert/update) + admin
-- (delete). Skips missing tables; leaves SELECT untouched.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._harden_admin_manager_writes(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  reg regclass := to_regclass('public.' || p_table);
  pol record;
BEGIN
  IF reg IS NULL THEN
    RAISE NOTICE 'restrict_cockpit_writes: skipping missing table %', p_table;
    RETURN;
  END IF;

  -- Refuse to touch a table that uses a catch-all FOR ALL policy: dropping it
  -- would also remove SELECT access, and leaving it would keep a write hole.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table AND cmd = 'ALL'
  ) THEN
    RAISE EXCEPTION 'restrict_cockpit_writes: table % has a FOR ALL policy; handle it explicitly', p_table;
  END IF;

  -- Drop every existing write policy (any name) so no staff-permitting policy
  -- survives. SELECT policies are deliberately left in place.
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = p_table
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, p_table);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY "admin_manager_insert_%1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY "admin_manager_update_%1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY "admin_delete_%1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_admin())',
    p_table
  );
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    -- Procurement / expenses
    'purchases',
    'operational_expenses',
    'expense_items',
    'master_categories',
    'suppliers',
    'supplier_account_payments',
    'supplier_debts',
    -- Liabilities / cash / payouts
    'liabilities',
    'liability_payments',
    'bank_withdrawals',
    'cash_movements',
    'platform_payouts',
    'transactions',
    -- Catalog / menu
    'products',
    'sales_channels',
    'modifier_groups',
    'modifier_options',
    'product_modifier_groups',
    -- Tax / payroll
    'tax_settings',
    'tax_payments',
    'employees',
    'salary_payments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    PERFORM public._harden_admin_manager_writes(t);
  END LOOP;
END $$;

-- combo_* tables ship with FOR ALL "Staff can manage …" policies (see
-- 20260418140100_combo_deals.sql). Replace those without touching storefront
-- SELECT policies ("Anyone can read …").
DROP POLICY IF EXISTS "Staff can manage combo deals" ON public.combo_deals;
CREATE POLICY "admin_manager_insert_combo_deals"
  ON public.combo_deals FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_manager_update_combo_deals"
  ON public.combo_deals FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_delete_combo_deals"
  ON public.combo_deals FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can manage combo groups" ON public.combo_groups;
CREATE POLICY "admin_manager_insert_combo_groups"
  ON public.combo_groups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_manager_update_combo_groups"
  ON public.combo_groups FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_delete_combo_groups"
  ON public.combo_groups FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can manage combo group items" ON public.combo_group_items;
CREATE POLICY "admin_manager_insert_combo_group_items"
  ON public.combo_group_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_manager_update_combo_group_items"
  ON public.combo_group_items FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_delete_combo_group_items"
  ON public.combo_group_items FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "admin_manager_insert_delivery_zones"
  ON public.delivery_zones FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_manager_update_delivery_zones"
  ON public.delivery_zones FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "admin_delete_delivery_zones"
  ON public.delivery_zones FOR DELETE TO authenticated
  USING (public.is_admin());

DROP FUNCTION public._harden_admin_manager_writes(text);
