/*
  # Customer profiles, saved addresses, sales.customer_user_id
  # Tighten sales SELECT for authenticated: staff see all; customers see only their orders.
*/

-- `online_settings` existed only in some legacy DBs; fresh installs need the table before
-- branding columns (below) and later UPDATE/ALTER migrations can run.
CREATE TABLE IF NOT EXISTS public.online_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  takeaway_enabled boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.online_settings (id, takeaway_enabled, delivery_enabled)
SELECT gen_random_uuid(), true, true
WHERE NOT EXISTS (SELECT 1 FROM public.online_settings);

-- ---------------------------------------------------------------------------
-- 1. sales.customer_user_id
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'customer_user_id'
  ) THEN
    ALTER TABLE public.sales
      ADD COLUMN customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_customer_user_id ON public.sales(customer_user_id)
  WHERE customer_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. customer_profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own profile"
  ON public.customer_profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. customer_addresses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  line1 text NOT NULL,
  lat double precision,
  lng double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own addresses"
  ON public.customer_addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Tighten authenticated SELECT on sales (replace wide open read)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read sales" ON public.sales;

CREATE POLICY "Staff can read all sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "Customers read own online sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (customer_user_id IS NOT NULL AND customer_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Branding fields for /order (optional hero)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN tagline text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN hero_image_url text;
  END IF;
END $$;
