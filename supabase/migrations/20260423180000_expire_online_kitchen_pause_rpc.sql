-- Auto-lift timed kitchen pause when `offline_until` has passed (keeps indefinite `offline_until` null unchanged).

CREATE OR REPLACE FUNCTION public.expire_online_kitchen_pause_if_due()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.online_settings
  SET is_open = true,
      offline_until = NULL
  WHERE is_open = false
    AND offline_until IS NOT NULL
    AND offline_until <= now();
END;
$$;

COMMENT ON FUNCTION public.expire_online_kitchen_pause_if_due() IS
  'Sets is_open=true when a timed pause has ended; indefinite close (offline_until null) is not changed.';

GRANT EXECUTE ON FUNCTION public.expire_online_kitchen_pause_if_due() TO anon, authenticated, service_role;
