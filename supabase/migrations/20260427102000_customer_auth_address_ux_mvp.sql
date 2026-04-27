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
