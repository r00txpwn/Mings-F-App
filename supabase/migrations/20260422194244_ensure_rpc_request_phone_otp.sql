-- Idempotent: OTP rate-limit table + RPC (fixes PGRST202 when 20260421174000 was skipped on remote).

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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.rpc_request_phone_otp(text) TO anon, authenticated, service_role;
