/*
  # Harden admin RLS — staff-only writes on cockpit tables

  Replaces legacy "Authenticated users can *" policies that allowed any
  auth.users row (including phone-OTP customers) to mutate finance/menu data.

  Storefront menu reads stay on anon/authenticated SELECT grants from
  20260426223000_grant_storefront_read_access.sql.
*/

CREATE OR REPLACE FUNCTION public.is_staff_user()
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
      AND u.role IN ('admin'::public.user_role, 'manager'::public.user_role, 'staff'::public.user_role)
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_user() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Admin audit log (append-only; written by admin-api Edge Function)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  resource_table text NOT NULL,
  resource_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read admin audit log" ON public.admin_audit_log;
CREATE POLICY "Staff can read admin audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- Helper: replace authenticated write policies with staff-only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._harden_staff_writes(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl text := p_table::text;
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON %s', split_part(tbl, '.', 2), tbl);

  EXECUTE format(
    'CREATE POLICY "Staff can view %I" ON %s FOR SELECT TO authenticated USING (public.is_staff_user())',
    split_part(tbl, '.', 2), tbl
  );
  EXECUTE format(
    'CREATE POLICY "Staff can insert %I" ON %s FOR INSERT TO authenticated WITH CHECK (public.is_staff_user())',
    split_part(tbl, '.', 2), tbl
  );
  EXECUTE format(
    'CREATE POLICY "Staff can update %I" ON %s FOR UPDATE TO authenticated USING (public.is_staff_user()) WITH CHECK (public.is_staff_user())',
    split_part(tbl, '.', 2), tbl
  );
  EXECUTE format(
    'CREATE POLICY "Staff can delete %I" ON %s FOR DELETE TO authenticated USING (public.is_staff_user())',
    split_part(tbl, '.', 2), tbl
  );
END;
$$;

SELECT public._harden_staff_writes('public.categories'::regclass);
SELECT public._harden_staff_writes('public.master_categories'::regclass);
SELECT public._harden_staff_writes('public.suppliers'::regclass);
SELECT public._harden_staff_writes('public.transactions'::regclass);

-- products: keep anon/authenticated menu SELECT via existing policies + grants;
-- only tighten writes.
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Staff can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_staff_user());

-- sales_channels: storefront reads via anon grant; staff-only writes.
DROP POLICY IF EXISTS "Authenticated users can insert sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can update sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can delete sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can view sales channels" ON public.sales_channels;

CREATE POLICY "Staff can insert sales channels"
  ON public.sales_channels FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can update sales channels"
  ON public.sales_channels FOR UPDATE TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can delete sales channels"
  ON public.sales_channels FOR DELETE TO authenticated
  USING (public.is_staff_user());

-- Modifier tables (legacy policy names used "read", not "view")
DROP POLICY IF EXISTS "Authenticated users can read modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can insert modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can update modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can delete modifier groups" ON public.modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can read modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "Authenticated users can insert modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "Authenticated users can update modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "Authenticated users can delete modifier options" ON public.modifier_options;
DROP POLICY IF EXISTS "Authenticated users can read product modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can insert product modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can update product modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can delete product modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Authenticated users can read sale item modifiers" ON public.sale_item_modifiers;
DROP POLICY IF EXISTS "Authenticated users can insert sale item modifiers" ON public.sale_item_modifiers;
DROP POLICY IF EXISTS "Authenticated users can update sale item modifiers" ON public.sale_item_modifiers;
DROP POLICY IF EXISTS "Authenticated users can delete sale item modifiers" ON public.sale_item_modifiers;

SELECT public._harden_staff_writes('public.modifier_groups'::regclass);
SELECT public._harden_staff_writes('public.modifier_options'::regclass);
SELECT public._harden_staff_writes('public.product_modifier_groups'::regclass);
SELECT public._harden_staff_writes('public.sale_item_modifiers'::regclass);

-- Expense / procurement
SELECT public._harden_staff_writes('public.expense_items'::regclass);
SELECT public._harden_staff_writes('public.operational_expenses'::regclass);
SELECT public._harden_staff_writes('public.purchases'::regclass);

-- platform_payouts: staff-only (replace created_by-only policies)
DROP POLICY IF EXISTS "Users can view own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can insert own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can update own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can delete own payouts" ON public.platform_payouts;

CREATE POLICY "Staff can view platform payouts"
  ON public.platform_payouts FOR SELECT TO authenticated
  USING (public.is_staff_user());

CREATE POLICY "Staff can insert platform payouts"
  ON public.platform_payouts FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can update platform payouts"
  ON public.platform_payouts FOR UPDATE TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can delete platform payouts"
  ON public.platform_payouts FOR DELETE TO authenticated
  USING (public.is_staff_user());

DROP FUNCTION public._harden_staff_writes(regclass);
