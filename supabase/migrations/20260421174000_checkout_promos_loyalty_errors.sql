-- Checkout enhancements: promos, tips, loyalty flags, dispatch failures, OTP rate limits

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'tip_amount'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN tip_amount numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'promo_code'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN promo_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promo_codes'
  ) THEN
    CREATE TABLE public.promo_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text UNIQUE NOT NULL,
      discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
      discount_value numeric NOT NULL DEFAULT 0,
      min_order_amount numeric NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      starts_at timestamptz,
      ends_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'loyalty_enabled'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN loyalty_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'loyalty_reward_every_orders'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN loyalty_reward_every_orders integer NOT NULL DEFAULT 10;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dispatch_failures'
  ) THEN
    CREATE TABLE public.dispatch_failures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id uuid,
      reason text,
      payload jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'otp_requests'
  ) THEN
    CREATE TABLE public.otp_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text NOT NULL,
      requested_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rpc_request_phone_otp(phone text)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_req timestamptz;
  cooldown_seconds integer := 45;
BEGIN
  SELECT requested_at
  INTO last_req
  FROM public.otp_requests
  WHERE otp_requests.phone = rpc_request_phone_otp.phone
  ORDER BY requested_at DESC
  LIMIT 1;

  IF last_req IS NOT NULL AND extract(epoch FROM (now() - last_req)) < cooldown_seconds THEN
    RETURN QUERY
    SELECT false, GREATEST(1, cooldown_seconds - extract(epoch FROM (now() - last_req))::integer);
    RETURN;
  END IF;

  INSERT INTO public.otp_requests(phone) VALUES (rpc_request_phone_otp.phone);
  RETURN QUERY SELECT true, 0;
END;
$$;
