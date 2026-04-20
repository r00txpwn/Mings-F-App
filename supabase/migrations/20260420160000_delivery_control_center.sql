/*
  # Delivery Control Center

  Formalises the `delivery_zones` table schema (it was created manually in
  prod earlier — this migration is idempotent and won't disturb existing rows),
  adds the new `online_settings` columns the new admin Delivery screen edits,
  and applies staff-only RLS so the cockpit can write while the customer
  storefront keeps its existing read access.

  All operations are guarded with IF EXISTS / IF NOT EXISTS so the migration
  is safe to run repeatedly across all environments (local, preview, prod).
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- delivery_zones
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  polygon jsonb NOT NULL,
  delivery_fee numeric(10, 2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10, 2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_zones'
      AND column_name = 'free_delivery_threshold'
  ) THEN
    ALTER TABLE public.delivery_zones
      ADD COLUMN free_delivery_threshold numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_zones'
      AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.delivery_zones
      ADD COLUMN sort_order int NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'delivery_zones'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.delivery_zones
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active delivery zones" ON public.delivery_zones;
CREATE POLICY "Anyone can read active delivery zones"
  ON public.delivery_zones FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Staff can manage delivery zones"
  ON public.delivery_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );

-- Touch updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.delivery_zones_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delivery_zones_touch_updated_at ON public.delivery_zones;
CREATE TRIGGER trg_delivery_zones_touch_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.delivery_zones_touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- online_settings — new columns + staff write policy
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND column_name = 'default_prep_time_minutes'
  ) THEN
    ALTER TABLE public.online_settings
      ADD COLUMN default_prep_time_minutes int NOT NULL DEFAULT 25;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND column_name = 'free_delivery_threshold'
  ) THEN
    ALTER TABLE public.online_settings
      ADD COLUMN free_delivery_threshold numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND column_name = 'dispatch_mode'
  ) THEN
    ALTER TABLE public.online_settings
      ADD COLUMN dispatch_mode text NOT NULL DEFAULT 'auto';
  END IF;
END $$;

-- CHECK constraint on dispatch_mode (added separately so re-runs don't fail).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND constraint_name = 'online_settings_dispatch_mode_check'
  ) THEN
    ALTER TABLE public.online_settings
      ADD CONSTRAINT online_settings_dispatch_mode_check
      CHECK (dispatch_mode IN ('auto', 'manual'));
  END IF;
END $$;

ALTER TABLE public.online_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read online settings" ON public.online_settings;
CREATE POLICY "Anyone can read online settings"
  ON public.online_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage online settings" ON public.online_settings;
CREATE POLICY "Staff can manage online settings"
  ON public.online_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- delivery_orders — staff read access for the dispatch tab
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read all delivery orders" ON public.delivery_orders;
CREATE POLICY "Staff can read all delivery orders"
  ON public.delivery_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );
