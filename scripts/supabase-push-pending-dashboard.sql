-- Run in Supabase Dashboard → SQL Editor (project dmrvycswdteuhfydchdr)
-- when npm run supabase:push times out on port 5432 from your PC.
-- Safe to re-run. Run SECTION 4 last (or after each section if running separately).
-- Note: SECTION 2 uses production-safe 20260614170000 (skips public.categories from 20260610120000).


-- =============================================================================
-- SECTION 1 — 20260427102000
-- =============================================================================

/*
  # Customer auth/address UX MVP schema support

  Backward-compatible additions for:
  - customer profile completion + legal consent capture
  - richer saved delivery address metadata
*/

-- ---------------------------------------------------------------------------
-- customer_profiles: completion + consent metadata
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'phone_verified_at'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN phone_verified_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN terms_accepted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'terms_version'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN terms_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'privacy_version'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN privacy_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'refund_version'
  ) THEN
    ALTER TABLE public.customer_profiles ADD COLUMN refund_version text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- customer_addresses: richer delivery details
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'address_type'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN address_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'building_name'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN building_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'entrance'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN entrance text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'door_name_or_number'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN door_name_or_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'leave_at'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN leave_at text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'access_method'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN access_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'intercom_name_or_number'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN intercom_name_or_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'door_code'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN door_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'access_other_instructions'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN access_other_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'courier_instructions'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN courier_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'entry_point_lat'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN entry_point_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'entry_point_lng'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN entry_point_lng double precision;
  END IF;
END $$;


-- =============================================================================
-- SECTION 2 — 20260614170000 (production-safe RLS; replaces 20260610120000)
-- =============================================================================

/*
  # Harden admin RLS (production-safe)

  Skips public.categories (not present on live DB). Idempotent with prior partial applies.
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

  EXECUTE format('DROP POLICY IF EXISTS "Staff can view %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Staff can insert %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Staff can update %I" ON %s', split_part(tbl, '.', 2), tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Staff can delete %I" ON %s', split_part(tbl, '.', 2), tbl);

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

SELECT public._harden_staff_writes('public.master_categories'::regclass);
SELECT public._harden_staff_writes('public.suppliers'::regclass);
SELECT public._harden_staff_writes('public.transactions'::regclass);

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Staff can insert products" ON public.products;
DROP POLICY IF EXISTS "Staff can update products" ON public.products;
DROP POLICY IF EXISTS "Staff can delete products" ON public.products;

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

DROP POLICY IF EXISTS "Authenticated users can insert sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can update sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can delete sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can view sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Staff can insert sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Staff can update sales channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Staff can delete sales channels" ON public.sales_channels;

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

SELECT public._harden_staff_writes('public.expense_items'::regclass);
SELECT public._harden_staff_writes('public.operational_expenses'::regclass);
SELECT public._harden_staff_writes('public.purchases'::regclass);

DROP POLICY IF EXISTS "Users can view own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can insert own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can update own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Users can delete own payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Staff can view platform payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Staff can insert platform payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Staff can update platform payouts" ON public.platform_payouts;
DROP POLICY IF EXISTS "Staff can delete platform payouts" ON public.platform_payouts;

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


-- =============================================================================
-- SECTION 3 — 20260618140000 KDS
-- =============================================================================

-- KDS (/kds) reads sales with the anon Supabase client (no staff JWT).
-- Prior policy only allowed anon SELECT where source = 'kiosk', so online_takeaway /
-- online_delivery orders were invisible on the kitchen board after the split deploy.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'Anon can read kitchen queue sales'
  ) THEN
    CREATE POLICY "Anon can read kitchen queue sales"
      ON public.sales FOR SELECT
      TO anon
      USING (
        source IN ('kiosk', 'online_delivery', 'online_takeaway')
        AND order_status IN ('pending', 'preparing', 'ready')
      );
  END IF;
END $$;

-- =============================================================================
-- SECTION 4 — record all 4 pending versions in migration history
-- =============================================================================

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260427102000'),
  ('20260610120000'),
  ('20260614170000'),
  ('20260618140000')
ON CONFLICT (version) DO NOTHING;
